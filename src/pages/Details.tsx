import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  Pencil,
  Repeat2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useApp } from "../stores/useApp";
import { paymentFor, registerPayment, statusOf } from "../services/domain";
import { fromLocal, localDate, money, validDate } from "../utils/dates";
import { CategoryIcon, Confirm, Empty, labels, Modal } from "../components/UI";
export default function Details() {
  const { id } = useParams(),
    navigate = useNavigate(),
    data = useApp((s) => s.data),
    mutate = useApp((s) => s.mutate),
    busy = useApp((s) => s.busy);
  const [remove, setRemove] = useState(false),
    [pay, setPay] = useState(false),
    [date, setDate] = useState(localDate());
  const o = data.occurrences.find((o) => o.id === id),
    bill = data.bills.find((b) => b.id === o?.billId);
  if (!o || !bill)
    return (
      <Empty
        title="Conta não encontrada"
        description="Ela pode ter sido excluída."
      />
    );
  const status = statusOf(data, o),
    payment = paymentFor(data, o.id);
  const history = data.payments
    .filter(
      (p) =>
        data.occurrences.find((x) => x.id === p.occurrenceId)?.billId ===
        bill.id,
    )
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return (
    <div className="detail-page">
      <Link className="back-link" to="/contas">
        <ArrowLeft size={18} />
        Suas contas
      </Link>
      <section className="card detail-hero">
        <CategoryIcon category={bill.category} />
        <h1>{bill.name}</h1>
        <span className={`status-badge ${status}`}>{labels[status]}</span>
        <div className="detail-amount">{money(o.amount)}</div>
        <p>Vencimento em {fromLocal(o.dueDate).toLocaleDateString("pt-BR")}</p>
        {payment ? (
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() =>
              void mutate(
                (d) => ({
                  ...d,
                  payments: d.payments.map((p) =>
                    p.id === payment.id ? { ...p, reversedAt: localDate() } : p,
                  ),
                }),
                "Pagamento desfeito",
              )
            }
          >
            <RotateCcw size={18} />
            Desfazer pagamento
          </button>
        ) : (
          <button className="primary-button" onClick={() => setPay(true)}>
            <Check size={19} />
            Marcar como paga
          </button>
        )}
      </section>
      <section className="card detail-data">
        <div>
          <span>Categoria</span>
          <strong>{bill.category}</strong>
        </div>
        <div>
          <span>
            <Repeat2 size={16} />
            Recorrência
          </span>
          <strong>
            {
              {
                once: "Única",
                weekly: "Semanal",
                monthly: "Mensal",
                yearly: "Anual",
              }[bill.recurrence]
            }
          </strong>
        </div>
        <div>
          <span>
            <Bell size={16} />
            Lembrete
          </span>
          <strong>{bill.reminder ? "No vencimento" : "Desativado"}</strong>
        </div>
        {bill.description && (
          <div className="description-row">
            <span>Descrição</span>
            <p>{bill.description}</p>
          </div>
        )}
      </section>
      <div className="detail-actions">
        <Link className="secondary-button" to={`/editar/${bill.id}`}>
          <Pencil size={17} />
          Editar conta
        </Link>
        <button className="delete-link" onClick={() => setRemove(true)}>
          <Trash2 size={17} />
          Excluir conta
        </button>
      </div>
      <div className="section-title">
        <h2>Histórico de pagamentos</h2>
      </div>
      <section className="card history-list">
        {history.length ? (
          history.map((p) => (
            <div key={p.id}>
              <span className={`stat-icon ${p.reversedAt ? "red" : "green"}`}>
                {p.reversedAt ? <RotateCcw size={18} /> : <Check size={18} />}
              </span>
              <div>
                <strong>
                  {p.reversedAt ? "Pagamento desfeito" : "Pagamento registrado"}
                </strong>
                <span>
                  {fromLocal(p.paidAt).toLocaleDateString("pt-BR")}
                  {p.reversedAt &&
                    ` · estornado em ${fromLocal(p.reversedAt).toLocaleDateString("pt-BR")}`}
                </span>
              </div>
              <strong>{money(p.amount)}</strong>
            </div>
          ))
        ) : (
          <Empty
            title="Nenhum pagamento ainda"
            description="Os pagamentos desta conta aparecerão aqui."
            action={false}
          />
        )}
      </section>
      {remove && (
        <Confirm
          title="Excluir esta conta?"
          description="A conta, todas as recorrências e o histórico de pagamentos serão excluídos. Essa ação não pode ser desfeita."
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            const ids = new Set(
              data.occurrences
                .filter((x) => x.billId === bill.id)
                .map((x) => x.id),
            );
            if (
              await mutate(
                (d) => ({
                  ...d,
                  bills: d.bills.filter((b) => b.id !== bill.id),
                  occurrences: d.occurrences.filter(
                    (x) => x.billId !== bill.id,
                  ),
                  payments: d.payments.filter((p) => !ids.has(p.occurrenceId)),
                }),
                "Conta excluída",
              )
            )
              navigate("/contas");
          }}
        />
      )}
      {pay && (
        <Modal title="Registrar pagamento" onClose={() => setPay(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!validDate(date) || date > localDate()) return;
              const ok = await mutate(
                (d) => registerPayment(d, o.id, date),
                "Pagamento registrado",
              );
              if (ok) setPay(false);
            }}
          >
            <p className="modal-description">
              {bill.name} · {money(o.amount)}
            </p>
            <label className="field-label">
              <CalendarDays size={16} />
              Data efetiva do pagamento
              <input
                type="date"
                required
                min="1900-01-01"
                max={localDate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <button className="primary-button submit-button" disabled={busy}>
              Confirmar pagamento
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
