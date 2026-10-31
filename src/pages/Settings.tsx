import { useRef, useState } from "react";
import {
  Bell,
  Check,
  Download,
  Info,
  Laptop,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useApp } from "../stores/useApp";
import { emptyData, generate, validateBackup } from "../services/domain";
import { requestReminders } from "../services/notifications";
import { exportBackup } from "../services/backup";
import { Confirm, Modal } from "../components/UI";
import type { Data } from "../types";
export default function Settings() {
  const { data, mutate, notify, busy } = useApp(),
    input = useRef<HTMLInputElement>(null);
  const [remove, setRemove] = useState<"all" | "demo" | null>(null),
    [privacy, setPrivacy] = useState(false),
    [backup, setBackup] = useState<Data | null>(null);
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10000000)
        throw new Error("O arquivo deve ter até 10 MB.");
      setBackup(validateBackup(JSON.parse(await file.text())));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível ler o backup.");
    }
    if (input.current) input.current.value = "";
  }
  async function exportFile() {
    try {
      await exportBackup(data);
      notify("Backup pronto");
    } catch {
      notify("Não foi possível exportar o backup. Tente novamente.");
    }
  }
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">DO SEU JEITO</div>
          <h1>Ajustes</h1>
          <p>Pequenos detalhes para uma rotina mais leve.</p>
        </div>
      </header>
      <div className="settings-layout">
        <section>
          <div className="section-title">
            <h2>Aparência</h2>
          </div>
          <div className="card settings-card">
            <p>Escolha como o ContaCerta aparece para você.</p>
            <div className="theme-options">
              {(
                [
                  ["light", "Claro", Sun],
                  ["dark", "Escuro", Moon],
                  ["system", "Sistema", Laptop],
                ] as const
              ).map(([theme, label, Icon]) => (
                <button
                  key={theme}
                  className={data.settings.theme === theme ? "selected" : ""}
                  aria-pressed={data.settings.theme === theme}
                  onClick={() =>
                    void mutate((d) => ({
                      ...d,
                      settings: { ...d.settings, theme },
                    }))
                  }
                >
                  <Icon size={23} />
                  <span>{label}</span>
                  {data.settings.theme === theme && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div className="section-title">
            <h2>Preferências</h2>
          </div>
          <div className="card settings-card">
            <label className="switch-row">
              <span>
                <Bell size={21} />
                <span>
                  <strong>Lembretes de vencimento</strong>
                  <small>Notificações locais às 9h</small>
                </span>
              </span>
              <input
                type="checkbox"
                className="switch"
                checked={data.settings.reminders}
                disabled={busy}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  try {
                    if (enabled) await requestReminders();
                    await mutate((d) => ({
                      ...d,
                      settings: { ...d.settings, reminders: enabled },
                    }));
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              />
            </label>
            <p className="field-help">
              Com o app fechado, os lembretes exigem a versão nativa Android/iOS
              e permissão de notificações. Não são enviados pela WebView
              sozinha. São agendados os próximos 60 lembretes; abra o app
              periodicamente para atualizar.
            </p>
            <div className="setting-row">
              <span>Moeda</span>
              <strong>Real brasileiro · BRL (R$)</strong>
            </div>
          </div>
        </section>
        <section>
          <div className="section-title">
            <h2>Seus dados</h2>
          </div>
          <div className="card settings-card">
            <div className="privacy-note">
              <ShieldCheck size={23} />
              <p>
                Seus dados ficam neste dispositivo.
                <br />
                <strong>Você está no controle.</strong>
              </p>
            </div>
            <button className="settings-action" onClick={exportFile}>
              <Download size={20} />
              <span>
                Exportar backup<small>Salvar todas as contas em JSON</small>
              </span>
            </button>
            <button
              className="settings-action"
              onClick={() => input.current?.click()}
            >
              <Upload size={20} />
              <span>
                Importar backup
                <small>Restaurar a partir de um arquivo JSON</small>
              </span>
            </button>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept=".json,application/json"
              onChange={(e) => void importFile(e.target.files?.[0])}
            />
            {data.settings.demo && (
              <button
                className="settings-action delete-link"
                onClick={() => setRemove("demo")}
              >
                <Trash2 size={20} />
                <span>
                  Remover demonstração
                  <small>Começar com suas próprias contas</small>
                </span>
              </button>
            )}
            <button
              className="settings-action delete-link"
              onClick={() => setRemove("all")}
            >
              <Trash2 size={20} />
              <span>Excluir todos os dados</span>
            </button>
          </div>
          <div className="section-title">
            <h2>Sobre o ContaCerta</h2>
          </div>
          <div className="card settings-card">
            <button
              className="settings-action"
              onClick={() => setPrivacy(true)}
            >
              <ShieldCheck size={20} />
              <span>Política de privacidade</span>
            </button>
            <div className="setting-row">
              <span>
                <Info size={17} />
                Versão
              </span>
              <strong>1.0.0</strong>
            </div>
          </div>
          <p className="settings-footer">
            Feito para uma vida com menos preocupações.
          </p>
        </section>
      </div>
      {remove && (
        <Confirm
          title={
            remove === "all"
              ? "Excluir todos os dados?"
              : "Remover demonstração?"
          }
          description="Esta ação é permanente. Exporte um backup se quiser preservar as informações."
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            const ok = await mutate((d) => {
              if (remove === "all")
                return {
                  ...emptyData(),
                  settings: { ...d.settings, demo: false, reminders: false },
                };
              const ids = new Set(
                d.bills
                  .filter((b) => b.id.startsWith("demo-"))
                  .map((b) => b.id),
              );
              const occurrenceIds = new Set(
                d.occurrences.filter((o) => ids.has(o.billId)).map((o) => o.id),
              );
              return {
                ...d,
                bills: d.bills.filter((b) => !ids.has(b.id)),
                occurrences: d.occurrences.filter((o) => !ids.has(o.billId)),
                payments: d.payments.filter(
                  (p) => !occurrenceIds.has(p.occurrenceId),
                ),
                settings: { ...d.settings, demo: false },
              };
            }, "Dados excluídos");
            if (ok) setRemove(null);
          }}
        />
      )}
      {backup && (
        <Modal title="Restaurar backup?" onClose={() => setBackup(null)}>
          <p className="modal-description">
            O arquivo contém {backup.bills.length} contas. A importação
            substituirá todos os dados atuais. Exporte um backup antes de
            continuar.
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => setBackup(null)}
            >
              Cancelar
            </button>
            <button
              className="primary-button"
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(
                    () =>
                      generate({
                        ...backup,
                        settings: { ...backup.settings, reminders: false },
                      }),
                    "Backup restaurado. Ative os lembretes se desejar.",
                  )
                )
                  setBackup(null);
              }}
            >
              Restaurar
            </button>
          </div>
        </Modal>
      )}
      {privacy && (
        <Modal
          title="Sua privacidade importa"
          onClose={() => setPrivacy(false)}
        >
          <div className="privacy-copy">
            <p>
              O ContaCerta armazena contas, pagamentos e preferências
              exclusivamente no IndexedDB deste navegador ou aplicativo, sem
              backend, anúncios ou ferramentas de rastreamento.
            </p>
            <p>
              Os dados não são enviados a servidores. Backups JSON contêm suas
              informações financeiras; guarde-os em um local de confiança.
            </p>
            <p>
              Limpar os dados do navegador ou desinstalar o aplicativo pode
              apagar seus registros. Exporte backups regularmente.
            </p>
            <p>
              Notificações são agendadas localmente com a sua permissão. O nome
              e o valor da conta podem aparecer na tela bloqueada, conforme as
              configurações do aparelho.
            </p>
            <p>
              Você pode remover todos os dados em Ajustes. Esta versão não
              acessa contas bancárias.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
