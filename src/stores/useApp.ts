import { create } from "zustand";
import type { Data } from "../types";
import { demoData, emptyData, generate } from "../services/domain";
import { readData, updateData } from "../services/storage";
import { syncReminders } from "../services/notifications";
interface State {
  data: Data;
  ready: boolean;
  error: string;
  toast: string;
  busy: boolean;
  init: () => Promise<void>;
  mutate: (fn: (d: Data) => Data, message?: string) => Promise<boolean>;
  notify: (s: string) => void;
}
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("contacerta-updates")
    : null;
let queue = Promise.resolve();
let timer: ReturnType<typeof setTimeout>;
export const useApp = create<State>((set, get) => ({
  data: emptyData(),
  ready: false,
  error: "",
  toast: "",
  busy: false,
  notify: (toast) => {
    clearTimeout(timer);
    set({ toast });
    timer = setTimeout(() => set({ toast: "" }), 4500);
  },
  init: async () => {
    try {
      const data = await updateData((stored) => generate(stored ?? demoData()));
      set({ data, ready: true, error: "" });
      void syncReminders(data).catch(() =>
        get().notify(
          "Não foi possível atualizar os lembretes. Verifique as permissões.",
        ),
      );
    } catch {
      set({
        error:
          "Não foi possível abrir o armazenamento local. Verifique se o navegador permite salvar dados.",
      });
    }
  },
  mutate: async (fn, message) => {
    let success = false;
    const run = queue.then(async () => {
      set({ busy: true });
      try {
        const data = await updateData((stored) => fn(stored ?? get().data));
        set({ data });
        channel?.postMessage("updated");
        success = true;
        if (message) get().notify(message);
        void syncReminders(data).catch(() =>
          get().notify(
            "Dados salvos. Não foi possível atualizar os lembretes.",
          ),
        );
      } catch (e) {
        get().notify(
          e instanceof Error
            ? e.message
            : "Não foi possível salvar. Tente novamente.",
        );
      } finally {
        set({ busy: false });
      }
    });
    queue = run.catch(() => {});
    await run;
    return success;
  },
}));

if (channel)
  channel.onmessage = () => {
    void readData()
      .then((data) => {
        if (data) useApp.setState({ data });
      })
      .catch(() =>
        useApp.getState().notify("Não foi possível sincronizar esta janela."),
      );
  };
