import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Data } from "../types";
import { localDate } from "../utils/dates";
export async function exportBackup(data: Data) {
  const name = `contacerta-${localDate()}.json`,
    content = JSON.stringify(data, null, 2);
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: name,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title: "Backup do ContaCerta",
      url: result.uri,
      dialogTitle: "Salvar backup",
    });
    return;
  }
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
