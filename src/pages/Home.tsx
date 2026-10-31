import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Plus,
  ShieldCheck,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "../stores/useApp";
import { statusOf } from "../services/domain";
import {
  dateLabel,
  localDate,
  money,
  monthKey,
  monthLabel,
} from "../utils/dates";
import { BillRow, Empty, SectionTitle, Tip } from "../components/UI";
export default function Home() {
  const data = useApp((s) => s.data);
  const [offset, setOffset] = useState(0);
  const now = new Date(),
    view = new Date(now.getFullYear(), now.getMonth() + offset, 1),
    key = monthKey(view);
  const list = data.occurrences.filter((o) => o.dueDate.startsWith(key));
  const paid = list.filter((o) => statusOf(data, o) === "paid"),
    pending = list.filter((o) => statusOf(data, o) !== "paid"),
    overdue = pending.filter((o) => statusOf(data, o) === "overdue");
  const total = list.reduce((a, o) => a + o.amount, 0),
    paidTotal = paid.reduce((a, o) => a + o.amount, 0),
    remaining = total - paidTotal,
    progress = total ? Math.round((paidTotal / total) * 100) : 0;
  const upcoming = [...pending]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const hour = now.getHours();
  const cats = Object.entries(
    list.reduce<Record<string, number>>((a, o) => {
      const c = data.bills.find((b) => b.id === o.billId)?.category ?? "Outros";
      a[c] = (a[c] ?? 0) + o.amount;
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">SEU DINHEIRO, COM MAIS CLAREZA</div>
          <h1>
            {hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"}{" "}
            <span className="greeting-sun">
              {hour < 18 ? (
                <Sun size={29} strokeWidth={1.6} />
              ) : (
                <Moon size={27} strokeWidth={1.6} />
              )}
            </span>
          </h1>
          <p>Contas em ordem. Mente tranquila.</p>
        </div>
        <Link className="primary-button header-add" to="/nova">
          <Plus size={18} /> Nova conta
        </Link>
      </header>
      <div className="month-control">
        <span className="month-title">{monthLabel(localDate(view))}</span>
        <div>
          <button
            aria-label="Mês anterior"
            onClick={() => setOffset(offset - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Próximo mês"
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <span className="month-current">
          {offset === 0 ? (
            "Este mês"
          ) : (
            <button onClick={() => setOffset(0)}>Voltar para hoje</button>
          )}
        </span>
      </div>
      <div className="dashboard-grid">
        <div className="main-column">
          <section className="balance-card">
            <div className="balance-top">
              <span>
                <span className="small-circle">
                  <ArrowUpRight size={16} />
                </span>{" "}
                Falta pagar este mês
              </span>
              <span className="balance-tag">VISÃO MENSAL</span>
            </div>
            <div className="balance-amount">{money(remaining)}</div>
            <p>
              {pending.length
                ? `${pending.length} conta${pending.length > 1 ? "s" : ""} para deixar tudo em dia`
                : "Tudo em dia. Aproveite essa tranquilidade."}
            </p>
            <div className="balance-progress-label">
              <span>Seu progresso</span>
              <strong>{progress}% concluído</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="balance-footer">
              <span>
                <CircleCheck size={15} /> {money(paidTotal)} pagos
              </span>
              <span>de {money(total)}</span>
            </div>
            <div className="balance-decoration" />
          </section>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon green">
                <ArrowDownLeft size={19} />
              </span>
              <span>Total pago</span>
              <strong>{money(paidTotal)}</strong>
              <small>{paid.length} contas em dia</small>
            </div>
            <div className="stat-card">
              <span className="stat-icon blue">
                <Clock3 size={19} />
              </span>
              <span>Pendentes</span>
              <strong>
                {pending.length - overdue.length}
                <small>contas</small>
              </strong>
              <small>Dentro do prazo</small>
            </div>
            <div className="stat-card">
              <span className={`stat-icon ${overdue.length ? "red" : "green"}`}>
                <TrendingUp size={19} />
              </span>
              <span>Vencidas</span>
              <strong>
                {overdue.length}
                <small>contas</small>
              </strong>
              <small>
                {overdue.length
                  ? "Vamos colocar em dia?"
                  : "Nenhuma preocupação"}
              </small>
            </div>
          </div>
          <SectionTitle to="/contas">Próximos vencimentos</SectionTitle>
          <section className="card bill-list">
            {upcoming.length ? (
              upcoming.map((o) => <BillRow key={o.id} occurrence={o} />)
            ) : (
              <Empty
                title="Tudo em dia neste mês"
                description="Você não tem contas pendentes por aqui."
              />
            )}
          </section>
          <Tip />
        </div>
        <aside className="right-column">
          <section className="card distribution">
            <div className="card-title">
              <h2>Para onde vai seu dinheiro</h2>
              <span>Despesas do mês</span>
            </div>
            {total > 0 ? (
              <>
                <div
                  className="donut"
                  style={{
                    background: `conic-gradient(${cats
                      .map((c, i) => {
                        const start =
                          (cats.slice(0, i).reduce((a, c) => a + c[1], 0) /
                            total) *
                          100;
                        return `var(--chart-${i % 6}) ${start}% ${start + (c[1] / total) * 100}%`;
                      })
                      .join(",")})`,
                  }}
                >
                  <div>
                    <span>Total do mês</span>
                    <strong>{money(total)}</strong>
                    <small>{list.length} contas</small>
                  </div>
                </div>
                <div className="legend">
                  {cats.map(([name, value], i) => (
                    <div key={name}>
                      <span>
                        <i style={{ background: `var(--chart-${i % 6})` }} />
                        {name}
                      </span>
                      <strong>{money(value)}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Empty
                title="Um novo começo"
                description="Suas despesas aparecerão aqui."
                action={false}
              />
            )}
          </section>
          <section className="peace-card">
            <span className="peace-illustration">
              <ShieldCheck size={39} strokeWidth={1.4} />
              <i>
                <Check size={12} />
              </i>
            </span>
            <h3>
              Organização que
              <br />
              traz tranquilidade.
            </h3>
            <p>Um passo de cada vez para uma vida financeira mais leve.</p>
            <div>
              <span /> Você está no controle
            </div>
          </section>
          <div className="local-note">
            <ShieldCheck size={14} /> Seus dados ficam só no seu dispositivo
          </div>
        </aside>
      </div>
      <Link to="/nova" className="mobile-fab" aria-label="Adicionar conta">
        <Plus size={26} />
      </Link>
    </>
  );
}
