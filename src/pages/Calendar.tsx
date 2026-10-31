import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../stores/useApp";
import { localDate, monthLabel } from "../utils/dates";
import { statusOf } from "../services/domain";
import { BillRow, Empty } from "../components/UI";
export default function Calendar() {
  const data = useApp((s) => s.data),
    today = localDate();
  const [view, setView] = useState(() => new Date()),
    [selected, setSelected] = useState(today);
  const y = view.getFullYear(),
    m = view.getMonth(),
    days = new Date(y, m + 1, 0).getDate(),
    start = new Date(y, m, 1).getDay();
  const list = data.occurrences.filter((o) => o.dueDate === selected);
  const change = (n: number) => {
    const next = new Date(y, m + n, 1);
    setView(next);
    setSelected(localDate(next));
  };
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">UM OLHAR PARA O QUE VEM</div>
          <h1>Calendário</h1>
          <p>Seus vencimentos, sem surpresas.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => {
            setView(new Date());
            setSelected(today);
          }}
        >
          Hoje
        </button>
      </header>
      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="calendar-heading">
            <h2>{monthLabel(localDate(view))}</h2>
            <div>
              <button
                className="icon-button"
                aria-label="Mês anterior"
                onClick={() => change(-1)}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="icon-button"
                aria-label="Próximo mês"
                onClick={() => change(1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <span className="weekday" key={i}>
                {d}
              </span>
            ))}
            {Array.from({ length: start }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = localDate(new Date(y, m, i + 1)),
                items = data.occurrences.filter((o) => o.dueDate === date);
              return (
                <button
                  key={date}
                  aria-label={`${i + 1}, ${items.length} contas`}
                  aria-pressed={selected === date}
                  className={`calendar-day ${selected === date ? "selected" : ""} ${today === date ? "today" : ""}`}
                  onClick={() => setSelected(date)}
                >
                  <span>{i + 1}</span>
                  <div>
                    {[...new Set(items.map((o) => statusOf(data, o)))].map(
                      (s) => (
                        <i key={s} className={s} />
                      ),
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>
              <i className="pending" />
              Pendente
            </span>
            <span>
              <i className="paid" />
              Paga
            </span>
            <span>
              <i className="overdue" />
              Vencida
            </span>
          </div>
        </section>
        <section>
          <div className="section-title">
            <h2>
              {new Date(`${selected}T12:00:00`).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}
            </h2>
            <span className="muted">{list.length} contas</span>
          </div>
          <div className="card bill-list">
            {list.length ? (
              list.map((o) => <BillRow key={o.id} occurrence={o} />)
            ) : (
              <Empty
                title="Um dia livre de contas"
                description="Nenhum vencimento na data selecionada."
                action={false}
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
