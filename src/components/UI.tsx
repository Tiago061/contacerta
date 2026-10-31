import { useEffect, useRef, useId, type ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  GraduationCap,
  Heart,
  Home,
  Inbox,
  ShoppingBag,
  Sparkles,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Category, Occurrence } from "../types";
import { useApp } from "../stores/useApp";
import { statusOf } from "../services/domain";
import { dateLabel, money } from "../utils/dates";
const icons: Record<Category, typeof Home> = {
  Moradia: Home,
  Serviços: Wifi,
  Assinaturas: CreditCard,
  Saúde: Heart,
  Educação: GraduationCap,
  Transporte: Building2,
  Compras: ShoppingBag,
  Outros: Wallet,
};
export const labels = { paid: "Paga", pending: "Pendente", overdue: "Vencida" };
export function CategoryIcon({ category }: { category: Category }) {
  const Icon = icons[category];
  return (
    <span className={`category-icon category-${category}`}>
      <Icon size={21} strokeWidth={1.8} />
    </span>
  );
}
export function BillRow({ occurrence: o }: { occurrence: Occurrence }) {
  const data = useApp((s) => s.data),
    b = data.bills.find((b) => b.id === o.billId);
  if (!b) return null;
  const status = statusOf(data, o);
  return (
    <Link to={`/conta/${encodeURIComponent(o.id)}`} className="bill-row">
      <CategoryIcon category={b.category} />
      <div className="bill-info">
        <strong>{b.name}</strong>
        <span>
          {b.category} <i>·</i> {dateLabel(o.dueDate)}
        </span>
      </div>
      <div className="bill-value">
        <strong>{money(o.amount)}</strong>
        <span className={`status-text ${status}`}>
          {status === "paid" && <Check size={12} />} {labels[status]}
        </span>
      </div>
      <ChevronRight size={16} className="muted row-chevron" />
    </Link>
  );
}
export function Empty({
  title = "Tudo tranquilo por aqui",
  description = "Adicione uma conta para começar a se organizar.",
  action = true,
}: {
  title?: string;
  description?: string;
  action?: boolean;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Link className="text-link" to="/nova">
          Adicionar conta <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function SectionTitle({
  children,
  to,
  action = "Ver todas",
}: {
  children: ReactNode;
  to?: string;
  action?: string;
}) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {to && (
        <Link to={to}>
          {action}
          <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const busy = useApp((s) => s.busy);
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal-description">{description}</p>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose}>
          Cancelar
        </button>
        <button className="danger-button" disabled={busy} onClick={onConfirm}>
          Excluir
        </button>
      </div>
    </Modal>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Check size={24} strokeWidth={3} />
      </span>
      <span>
        Conta<span className="brand-light">Certa</span>
        <small>MAIS CONTROLE. MAIS LEVEZA.</small>
      </span>
    </div>
  );
}
export function Tip() {
  return (
    <div className="tip">
      <span className="tip-icon">
        <Sparkles size={19} />
      </span>
      <div>
        <strong>Um hábito que faz diferença</strong>
        <p>
          Reserve um momento da semana para cuidar das suas contas. Seu futuro
          agradece.
        </p>
      </div>
    </div>
  );
}
