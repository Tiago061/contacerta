import { expect, it } from "vitest";
import { createId, cloneRecord } from "./compat";
it("gera IDs UUID v4 únicos sem depender de randomUUID", () => {
  const ids = Array.from({ length: 1000 }, () => createId());
  expect(new Set(ids).size).toBe(1000);
  expect(
    ids.every((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        id,
      ),
    ),
  ).toBe(true);
});
it("clona backups sem compartilhar referências nem depender de structuredClone", () => {
  const source = {
    bills: [{ name: "Conta", amount: 12345 }],
    settings: { reminders: false },
  };
  const clone = cloneRecord(source);
  clone.bills[0].name = "Alterada";
  expect(source.bills[0].name).toBe("Conta");
  expect(clone.bills[0].amount).toBe(12345);
});
