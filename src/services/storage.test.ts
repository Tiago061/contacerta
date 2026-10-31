import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { emptyData } from "./domain";
import { readData, writeData, updateData } from "./storage";
it("persiste e substitui snapshots atomicamente no IndexedDB", async () => {
  expect(await readData()).toBeUndefined();
  const data = emptyData();
  await writeData(data);
  expect(await readData()).toEqual(data);
  data.settings.theme = "dark";
  await writeData(data);
  expect((await readData())?.settings.theme).toBe("dark");
});

it("serializa gravações concorrentes sem perder alterações", async () => {
  await writeData(emptyData());
  await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      updateData((d) => ({
        ...d!,
        bills: [
          ...d!.bills,
          {
            id: `b${i}`,
            name: "Teste",
            amount: 100,
            category: "Outros",
            dueDate: "2026-10-31",
            description: "",
            recurrence: "once",
            reminder: false,
          },
        ],
      })),
    ),
  );
  expect((await readData())?.bills).toHaveLength(5);
});
