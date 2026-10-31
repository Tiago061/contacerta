import type { Data } from "../types";
let dbPromise: Promise<IDBDatabase> | undefined;
function database() {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("contacerta", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("app");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(
        new Error("Feche outras janelas do ContaCerta e tente novamente."),
      );
  }));
}
export async function readData(): Promise<Data | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("app", "readonly"),
      req = tx.objectStore("app").get("data");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function writeData(data: Data) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("app", "readwrite");
    tx.objectStore("app").put(data, "data");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Reading and writing inside one transaction also serializes mutations across tabs.
export async function updateData(
  fn: (data: Data | undefined) => Data,
): Promise<Data> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("app", "readwrite");
    const objectStore = tx.objectStore("app");
    const request = objectStore.get("data");
    let next: Data;
    request.onsuccess = () => {
      try {
        next = fn(request.result);
        objectStore.put(next, "data");
      } catch (error) {
        tx.abort();
        reject(error);
      }
    };
    tx.oncomplete = () => resolve(next);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error("Não foi possível salvar."));
  });
}
