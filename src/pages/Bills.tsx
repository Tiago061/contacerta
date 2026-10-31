import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../stores/useApp";
import { statusOf } from "../services/domain";
import { monthKey, monthLabel } from "../utils/dates";
import { BillRow, Empty } from "../components/UI";
export default function Bills() {
  const data = useApp((s) => s.data);
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [month, setMonth] = useState(monthKey());
  const list = data.occurrences
    .filter(
      (o) =>
        o.dueDate.startsWith(month) &&
        (filter === "all" || statusOf(data, o) === filter) &&
        data.bills
          .find((b) => b.id === o.billId)
          ?.name.toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">CADA CONTA NO SEU LUGAR</div>
          <h1>Suas contas</h1>
          <p>Mais organização, menos imprevistos.</p>
        </div>
        <Link to="/nova" className="primary-button">
          <Plus size={18} />
          Nova conta
        </Link>
      </header>
      <div className="bills-toolbar">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Buscar conta"
            placeholder="Buscar pelo nome da conta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <input
          aria-label="Mês das contas"
          type="month"
          min="1900-01"
          max="2200-12"
          required
          value={month}
          onChange={(e) => {
            if (e.target.value) setMonth(e.target.value);
          }}
        />
      </div>
      <div className="filter-tabs">
        {[
          ["all", "Todas"],
          ["pending", "Pendentes"],
          ["paid", "Pagas"],
          ["overdue", "Vencidas"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={filter === id ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="section-title">
        <h2 className="capitalize">{monthLabel(`${month}-01`)}</h2>
        <span className="muted">{list.length} contas</span>
      </div>
      {list.length ? (
        <>
          {(["overdue", "pending", "paid"] as const).map((status) => {
            const group = list.filter((o) => statusOf(data, o) === status);
            return (
              group.length > 0 && (
                <section className="bill-group" key={status}>
                  <h3 className={`status-text ${status}`}>
                    {status === "overdue"
                      ? "Vencidas"
                      : status === "pending"
                        ? "A pagar"
                        : "Pagas"}{" "}
                    <span>{group.length}</span>
                  </h3>
                  <div className="card bill-list">
                    {group.map((o) => (
                      <BillRow key={o.id} occurrence={o} />
                    ))}
                  </div>
                </section>
              )
            );
          })}
        </>
      ) : (
        <section className="card">
          <Empty
            title={
              search ? "Nenhuma conta encontrada" : "Nenhuma conta por aqui"
            }
            description={
              search
                ? "Tente outro nome ou ajuste os filtros."
                : "Adicione uma conta ou selecione outro mês."
            }
          />
        </section>
      )}
    </>
  );
}
