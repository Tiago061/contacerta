import { createId, cloneRecord } from "../utils/compat";
import { categories, type Bill, type Data, type Occurrence } from "../types";
import { fromLocal, localDate, validDate } from "../utils/dates";
export const emptyData = (): Data => ({
  version: 1,
  bills: [],
  occurrences: [],
  payments: [],
  settings: { theme: "system", reminders: false, demo: false },
});
export const paymentFor = (data: Data, id: string) =>
  data.payments.find((p) => p.occurrenceId === id && !p.reversedAt);
export function registerPayment(
  data: Data,
  occurrenceId: string,
  paidAt: string,
): Data {
  const occurrence = data.occurrences.find((o) => o.id === occurrenceId);
  if (!occurrence) throw new Error("Conta não encontrada.");
  if (!validDate(paidAt) || paidAt > localDate())
    throw new Error("Informe a data efetiva do pagamento, até hoje.");
  if (paymentFor(data, occurrenceId)) return data;
  return {
    ...data,
    payments: [
      ...data.payments,
      {
        id: createId(),
        occurrenceId,
        paidAt,
        amount: occurrence.amount,
      },
    ],
  };
}
export const statusOf = (data: Data, o: Occurrence, today = localDate()) =>
  paymentFor(data, o.id) ? "paid" : o.dueDate < today ? "overdue" : "pending";
function cycleKey(date: string, recurrence: Bill["recurrence"]) {
  if (recurrence === "once") return "once";
  if (recurrence === "monthly") return date.slice(0, 7);
  if (recurrence === "yearly") return date.slice(0, 4);
  const day = fromLocal(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return localDate(day);
}
export function generate(data: Data, today = localDate()): Data {
  const horizon = fromLocal(today);
  horizon.setFullYear(horizon.getFullYear() + 1);
  const existing = new Set(data.occurrences.map((o) => o.id));
  const occurrences = [...data.occurrences];
  for (const bill of data.bills) {
    const cycles = new Set(
      occurrences
        .filter((o) => o.billId === bill.id)
        .map((o) => cycleKey(o.dueDate, bill.recurrence)),
    );
    const start = fromLocal(bill.dueDate);
    for (let n = 0; n < 16000; n++) {
      const d = new Date(start);
      if (bill.recurrence === "weekly") d.setDate(start.getDate() + 7 * n);
      if (bill.recurrence === "monthly" || bill.recurrence === "yearly") {
        const months = bill.recurrence === "monthly" ? n : n * 12;
        d.setDate(1);
        d.setMonth(start.getMonth() + months);
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        d.setDate(Math.min(start.getDate(), last));
      }
      if (n > 0 && d > horizon) break;
      const dueDate = localDate(d),
        id = `${bill.id}:${dueDate}`;
      const cycle = cycleKey(dueDate, bill.recurrence);
      if (!existing.has(id) && !cycles.has(cycle)) {
        cycles.add(cycle);
        occurrences.push({ id, billId: bill.id, dueDate, amount: bill.amount });
        existing.add(id);
      }
      if (bill.recurrence === "once") break;
    }
  }
  return { ...data, occurrences };
}
export function saveBill(data: Data, bill: Bill): Data {
  const old = data.bills.find((b) => b.id === bill.id);
  // Paid and reversed occurrences retain their original amounts and dates.
  const historical = new Set(data.payments.map((p) => p.occurrenceId));
  const occurrences = data.occurrences.filter(
    (o) =>
      o.billId !== bill.id ||
      historical.has(o.id) ||
      (old && o.dueDate < localDate() && o.dueDate !== old.dueDate),
  );
  return generate({
    ...data,
    bills: [...data.bills.filter((b) => b.id !== bill.id), bill],
    occurrences,
  });
}
export function validateBackup(value: unknown): Data {
  if (!value || typeof value !== "object") throw new Error("Backup inválido.");
  const d = value as Data;
  const fail = () => {
    throw new Error("O arquivo não é um backup válido do ContaCerta.");
  };
  if (
    d.version !== 1 ||
    !Array.isArray(d.bills) ||
    !Array.isArray(d.occurrences) ||
    !Array.isArray(d.payments) ||
    !d.settings ||
    d.bills.length > 10000 ||
    d.occurrences.length > 100000
  )
    fail();
  const ids = new Set<string>();
  for (const b of d.bills) {
    if (
      typeof b.id !== "string" ||
      !b.id ||
      ids.has(b.id) ||
      typeof b.name !== "string" ||
      !b.name.trim() ||
      b.name.length > 100 ||
      !Number.isSafeInteger(b.amount) ||
      b.amount <= 0 ||
      b.amount > 99999999999 ||
      !categories.includes(b.category) ||
      !validDate(b.dueDate) ||
      typeof b.description !== "string" ||
      typeof b.reminder !== "boolean" ||
      !["once", "weekly", "monthly", "yearly"].includes(b.recurrence)
    )
      fail();
    ids.add(b.id);
  }
  const occurrences = new Set<string>();
  for (const o of d.occurrences) {
    if (
      !ids.has(o.billId) ||
      o.id !== `${o.billId}:${o.dueDate}` ||
      occurrences.has(o.id) ||
      !validDate(o.dueDate) ||
      !Number.isSafeInteger(o.amount) ||
      o.amount <= 0
    )
      fail();
    occurrences.add(o.id);
  }
  const active = new Set<string>(),
    payments = new Set<string>();
  for (const p of d.payments) {
    if (
      !occurrences.has(p.occurrenceId) ||
      typeof p.id !== "string" ||
      payments.has(p.id) ||
      !validDate(p.paidAt) ||
      (p.reversedAt !== undefined && !validDate(p.reversedAt)) ||
      !Number.isSafeInteger(p.amount) ||
      p.amount <= 0 ||
      (!p.reversedAt && active.has(p.occurrenceId))
    )
      fail();
    payments.add(p.id);
    if (!p.reversedAt) active.add(p.occurrenceId);
  }
  if (
    !["system", "light", "dark"].includes(d.settings.theme) ||
    typeof d.settings.reminders !== "boolean" ||
    typeof d.settings.demo !== "boolean"
  )
    fail();
  return cloneRecord(d);
}
export function demoData(): Data {
  const now = new Date(),
    y = now.getFullYear(),
    m = now.getMonth();
  const date = (day: number) => localDate(new Date(y, m, day));
  const seed: [string, number, Bill["category"], number, Bill["recurrence"]][] =
    [
      ["Aluguel", 185000, "Moradia", 5, "monthly"],
      ["Internet fibra", 11990, "Serviços", 10, "monthly"],
      ["Spotify Premium", 2190, "Assinaturas", 12, "monthly"],
      ["Energia elétrica", 18645, "Serviços", 18, "monthly"],
      ["Academia", 12990, "Saúde", 22, "monthly"],
      ["Netflix", 3990, "Assinaturas", 25, "monthly"],
      ["Plano de saúde", 38900, "Saúde", 28, "monthly"],
    ];
  const data = generate({
    ...emptyData(),
    settings: { theme: "system", reminders: false, demo: true },
    bills: seed.map(([name, amount, category, day, recurrence], i) => ({
      id: `demo-${i}`,
      name,
      amount,
      category,
      dueDate: date(day),
      description: "Conta de demonstração. Você pode editar ou remover.",
      recurrence,
      reminder: false,
    })),
  });
  data.payments = data.occurrences
    .filter(
      (o) =>
        o.dueDate.slice(0, 7) === localDate().slice(0, 7) &&
        ["demo-0", "demo-1", "demo-2"].includes(o.billId),
    )
    .map((o) => ({
      id: createId(),
      occurrenceId: o.id,
      paidAt: o.dueDate,
      amount: o.amount,
    }));
  return data;
}
