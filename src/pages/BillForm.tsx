import { createId } from "../utils/compat";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, Bell } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { categories, type Bill } from "../types";
import { useApp } from "../stores/useApp";
import { saveBill } from "../services/domain";
import { localDate, parseMoney, validDate } from "../utils/dates";
export default function BillForm() {
  const { id } = useParams(),
    data = useApp((s) => s.data),
    mutate = useApp((s) => s.mutate),
    busy = useApp((s) => s.busy),
    navigate = useNavigate();
  const existing = data.bills.find((b) => b.id === id);
  const [form, setForm] = useState<Bill>(
    () =>
      existing ?? {
        id: createId(),
        name: "",
        amount: 0,
        category: "Outros",
        dueDate: localDate(),
        description: "",
        recurrence: "once",
        reminder: false,
      },
  );
  const [value, setValue] = useState(
      existing ? (existing.amount / 100).toFixed(2).replace(".", ",") : "",
    ),
    [error, setError] = useState("");
  const update = (key: keyof Bill, value: unknown) =>
    setForm((s) => ({ ...s, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    const amount = parseMoney(value);
    if (
      !form.name.trim() ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > 99999999999 ||
      !validDate(form.dueDate)
    ) {
      setError("Preencha o nome, um valor maior que zero e uma data válida.");
      return;
    }
    if (
      await mutate(
        (d) => saveBill(d, { ...form, name: form.name.trim(), amount }),
        existing ? "Conta atualizada" : "Conta adicionada",
      )
    )
      navigate("/contas");
  }
  if (id && !existing)
    return (
      <p>
        Conta não encontrada. <Link to="/contas">Voltar às contas</Link>
      </p>
    );
  return (
    <div className="form-page">
      <Link className="back-link" to={existing ? "/contas" : "/"}>
        <ArrowLeft size={18} />
        Voltar
      </Link>
      <header className="page-header">
        <div>
          <div className="eyebrow">UM PASSO PARA SE ORGANIZAR</div>
          <h1>{existing ? "Editar conta" : "Nova conta"}</h1>
          <p>
            {existing
              ? "Mantenha seus dados em dia."
              : "Deixe que a gente te ajude a lembrar."}
          </p>
        </div>
      </header>
      <form onSubmit={submit} className="card bill-form">
        <label>
          Nome da conta
          <input
            required
            maxLength={100}
            autoFocus
            placeholder="Ex.: Internet de casa"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </label>
        <label>
          Valor da conta
          <div className="currency-input">
            <span>R$</span>
            <input
              aria-label="Valor em reais"
              required
              inputMode="decimal"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={16}
            />
          </div>
        </label>
        <div className="form-columns">
          <label>
            Categoria
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Vencimento
            <input
              type="date"
              required
              min="1900-01-01"
              max="2200-12-31"
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </label>
        </div>
        <label>
          Repetir
          <select
            value={form.recurrence}
            onChange={(e) => update("recurrence", e.target.value)}
          >
            <option value="once">Não repetir · conta única</option>
            <option value="weekly">Toda semana</option>
            <option value="monthly">Todo mês</option>
            <option value="yearly">Todo ano</option>
          </select>
        </label>
        {existing && (
          <p className="field-help">
            Alterações atualizam a conta e as próximas recorrências. Pagamentos
            já registrados e seus valores são preservados.
          </p>
        )}
        <label>
          Descrição <span className="muted">(opcional)</span>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Algum detalhe que você queira guardar"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <label className="switch-row">
          <span>
            <Bell size={19} />
            <span>
              <strong>Lembrar no vencimento</strong>
              <small>Às 9h, na versão nativa instalada</small>
            </span>
          </span>
          <input
            className="switch"
            type="checkbox"
            checked={form.reminder}
            onChange={(e) => update("reminder", e.target.checked)}
          />
        </label>
        {form.reminder && !data.settings.reminders && (
          <p className="field-help">
            Ative os lembretes em Ajustes para permitir as notificações.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary-button submit-button"
          disabled={busy}
          type="submit"
        >
          <Check size={19} />
          {busy
            ? "Salvando…"
            : existing
              ? "Salvar alterações"
              : "Adicionar conta"}
        </button>
      </form>
    </div>
  );
}
