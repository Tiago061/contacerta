export const categories = [
  "Moradia",
  "Serviços",
  "Assinaturas",
  "Saúde",
  "Educação",
  "Transporte",
  "Compras",
  "Outros",
] as const;
export type Category = (typeof categories)[number];
export type Recurrence = "once" | "weekly" | "monthly" | "yearly";
export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: Category;
  dueDate: string;
  description: string;
  recurrence: Recurrence;
  reminder: boolean;
}
export interface Occurrence {
  id: string;
  billId: string;
  dueDate: string;
  amount: number;
}
export interface Payment {
  id: string;
  occurrenceId: string;
  paidAt: string;
  amount: number;
  reversedAt?: string;
}
export interface Settings {
  theme: "system" | "light" | "dark";
  reminders: boolean;
  demo: boolean;
}
export interface Data {
  version: 1;
  bills: Bill[];
  occurrences: Occurrence[];
  payments: Payment[];
  settings: Settings;
}
