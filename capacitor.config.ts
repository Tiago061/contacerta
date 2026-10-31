import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "app.contacerta.mobile",
  appName: "ContaCerta",
  webDir: "dist",
  plugins: { LocalNotifications: { iconColor: "#007AFF" } },
};
export default config;
