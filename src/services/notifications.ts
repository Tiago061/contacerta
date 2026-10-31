import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Data } from "../types";
import { paymentFor } from "./domain";
import { fromLocal, money } from "../utils/dates";
export async function requestReminders() {
  if (!Capacitor.isNativePlatform())
    throw new Error(
      "Lembretes com o app fechado estão disponíveis na versão instalada para Android e iOS.",
    );
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted")
    throw new Error("Permissão de notificações não concedida.");
}
async function scheduleReminders(data: Data) {
  if (!Capacitor.isNativePlatform()) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length)
    await LocalNotifications.cancel({ notifications: pending.notifications });
  if (!data.settings.reminders) return;
  const notifications = data.occurrences
    .filter(
      (o) =>
        data.bills.find((b) => b.id === o.billId)?.reminder &&
        !paymentFor(data, o.id),
    )
    .map((o) => {
      const at = fromLocal(o.dueDate);
      at.setHours(9, 0, 0, 0);
      return { o, at };
    })
    .filter((x) => x.at > new Date())
    .sort((a, b) => +a.at - +b.at)
    .slice(0, 60)
    .map(({ o, at }, i) => ({
      id: i + 1,
      title: "Sua conta vence hoje",
      body: `${data.bills.find((b) => b.id === o.billId)?.name} · ${money(o.amount)}`,
      schedule: { at },
      extra: { occurrenceId: o.id },
    }));
  if (notifications.length)
    await LocalNotifications.schedule({ notifications });
}

let notificationQueue = Promise.resolve();
export function syncReminders(data: Data) {
  const current = notificationQueue
    .catch(() => {})
    .then(() => scheduleReminders(data));
  notificationQueue = current;
  return current;
}
