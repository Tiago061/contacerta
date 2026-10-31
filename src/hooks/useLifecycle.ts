import { useEffect } from "react";
import { useApp } from "../stores/useApp";
import { generate } from "../services/domain";
export function useLifecycle() {
  const theme = useApp((s) => s.data.settings.theme);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && useApp.getState().ready)
        void useApp.getState().mutate((d) => generate(d));
    };
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
}
