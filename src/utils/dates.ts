export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromLocal = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const validDate = (s: unknown): s is string =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  localDate(fromLocal(s)) === s &&
  s >= "1900-01-01" &&
  s <= "2200-12-31";
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const dateLabel = (s: string) =>
  fromLocal(s)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
export const monthLabel = (s: string) =>
  fromLocal(s).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
export const monthKey = (d = new Date()) => localDate(d).slice(0, 7);
export function parseMoney(value: string) {
  const clean = value
    .trim()
    .replace(/R\$\s*/g, "")
    .replace(/\s/g, "");
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
