import { describe, expect, it } from "vitest";
import {
  emptyData,
  generate,
  paymentFor,
  registerPayment,
  saveBill,
  statusOf,
  validateBackup,
} from "./domain";
import { localDate, parseMoney } from "../utils/dates";
import type { Bill } from "../types";
const bill: Bill = {
  id: "rent",
  name: "Aluguel",
  amount: 12345,
  category: "Moradia",
  dueDate: "2026-01-31",
  description: "",
  recurrence: "monthly",
  reminder: false,
};
describe("recorrências e dinheiro", () => {
  it("mantém centavos inteiros e rejeita valores ambíguos", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("0,10")).toBe(10);
    expect(parseMoney("19.99")).toBe(1999);
    expect(parseMoney("1,234")).toBeNaN();
    expect(parseMoney("-1")).toBeNaN();
  });
  it("usa datas locais sem deslocamento UTC", () => {
    expect(localDate(new Date(2026, 9, 31, 0, 1))).toBe("2026-10-31");
  });
  it("ancora dias no fim do mês sem desviar março e não duplica gerações", () => {
    const d = generate({ ...emptyData(), bills: [bill] }, "2026-03-01");
    expect(d.occurrences.slice(0, 3).map((o) => o.dueDate)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
    expect(generate(d, "2026-03-01").occurrences).toEqual(d.occurrences);
  });
  it("trata ano bissexto, semanal e conta única", () => {
    const yearly = generate(
      {
        ...emptyData(),
        bills: [{ ...bill, dueDate: "2024-02-29", recurrence: "yearly" }],
      },
      "2027-03-01",
    );
    expect(yearly.occurrences.map((o) => o.dueDate)).toEqual([
      "2024-02-29",
      "2025-02-28",
      "2026-02-28",
      "2027-02-28",
      "2028-02-29",
    ]);
    const once = generate(
      { ...emptyData(), bills: [{ ...bill, recurrence: "once" }] },
      "2026-03-01",
    );
    expect(once.occurrences).toHaveLength(1);
    const weekly = generate(
      {
        ...emptyData(),
        bills: [{ ...bill, recurrence: "weekly", dueDate: "2026-12-28" }],
      },
      "2026-12-28",
    );
    expect(weekly.occurrences.slice(0, 2).map((o) => o.dueDate)).toEqual([
      "2026-12-28",
      "2027-01-04",
    ]);
  });
  it("calcula atraso pela data local, pagamento e estorno", () => {
    const d = generate({ ...emptyData(), bills: [bill] }, "2026-03-01"),
      o = d.occurrences[0];
    expect(statusOf(d, o, "2026-01-31")).toBe("pending");
    expect(statusOf(d, o, "2026-02-01")).toBe("overdue");
    d.payments.push({
      id: "p1",
      occurrenceId: o.id,
      paidAt: "2026-02-02",
      amount: o.amount,
    });
    expect(statusOf(d, o, "2026-03-01")).toBe("paid");
    expect(paymentFor(d, o.id)?.paidAt).toBe("2026-02-02");
    d.payments[0].reversedAt = "2026-03-01";
    expect(statusOf(d, o, "2026-03-01")).toBe("overdue");
    expect(d.payments).toHaveLength(1);
  });
  it("preserva o valor das ocorrências pagas em edições", () => {
    const d = generate({ ...emptyData(), bills: [bill] }),
      o = d.occurrences[0];
    d.payments.push({
      id: "p1",
      occurrenceId: o.id,
      paidAt: "2026-01-31",
      amount: o.amount,
    });
    const next = saveBill(d, { ...bill, amount: 99999 });
    expect(next.occurrences.find((x) => x.id === o.id)?.amount).toBe(12345);
    expect(next.payments).toEqual(d.payments);
    expect(new Set(next.occurrences.map((o) => o.id)).size).toBe(
      next.occurrences.length,
    );
  });
  it("impede pagamento duplicado e permite novo pagamento após estorno", () => {
    let d = generate({ ...emptyData(), bills: [bill] });
    const id = d.occurrences[0].id;
    d = registerPayment(d, id, "2026-01-31");
    expect(registerPayment(d, id, "2026-02-01").payments).toHaveLength(1);
    d.payments[0].reversedAt = "2026-02-01";
    d = registerPayment(d, id, "2026-02-01");
    expect(d.payments).toHaveLength(2);
    expect(d.payments.filter((p) => !p.reversedAt)).toHaveLength(1);
    expect(() => registerPayment(d, id, "2200-01-01")).toThrow();
  });
  it("não recria um ciclo já pago ao alterar o vencimento", () => {
    const d = generate({ ...emptyData(), bills: [bill] });
    const o = d.occurrences[0];
    d.payments.push({
      id: "p1",
      occurrenceId: o.id,
      paidAt: "2026-01-31",
      amount: o.amount,
    });
    const next = saveBill(d, { ...bill, dueDate: "2026-01-30" });
    expect(
      next.occurrences.filter((x) => x.dueDate.startsWith("2026-01")),
    ).toHaveLength(1);
    expect(next.occurrences.find((x) => x.id === o.id)).toEqual(o);
  });
  it("valida referências, datas, centavos e pagamentos duplicados no backup", () => {
    const d = generate({ ...emptyData(), bills: [bill] }, "2026-03-01");
    expect(validateBackup(d)).toEqual(d);
    expect(() => validateBackup({ ...d, version: 2 })).toThrow();
    expect(() =>
      validateBackup({ ...d, bills: [{ ...bill, dueDate: "2026-02-30" }] }),
    ).toThrow();
    expect(() =>
      validateBackup({ ...d, bills: [{ ...bill, amount: 1.1 }] }),
    ).toThrow();
    expect(() =>
      validateBackup({
        ...d,
        occurrences: [{ ...d.occurrences[0], billId: "missing" }],
      }),
    ).toThrow();
    const p = {
      id: "p1",
      occurrenceId: d.occurrences[0].id,
      paidAt: "2026-02-01",
      amount: 12345,
    };
    expect(() =>
      validateBackup({ ...d, payments: [p, { ...p, id: "p2" }] }),
    ).toThrow();
  });
});
