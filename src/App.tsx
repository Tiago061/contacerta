import { useEffect } from "react";
import {
  HashRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
  Link,
} from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  House,
  ReceiptText,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "./stores/useApp";
import { useLifecycle } from "./hooks/useLifecycle";
import { Brand } from "./components/UI";
import Home from "./pages/Home";
import Bills from "./pages/Bills";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import BillForm from "./pages/BillForm";
import Details from "./pages/Details";
const navigation = [
  ["/", "Início", House],
  ["/contas", "Contas", ReceiptText],
  ["/calendario", "Calendário", CalendarDays],
  ["/ajustes", "Ajustes", Settings2],
] as const;
function Shell() {
  const { ready, error, toast, init, data } = useApp();
  useLifecycle();
  const location = useLocation();
  useEffect(() => {
    void init();
  }, [init]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" aria-label="ContaCerta, início">
          <Brand />
        </Link>
        <div className="sidebar-label">SEU ESPAÇO</div>
        <nav aria-label="Navegação principal">
          {navigation.map(([to, label, Icon]) => (
            <NavLink end={to === "/"} to={to} key={to}>
              <Icon size={21} strokeWidth={1.8} />
              {label}
              <ChevronRight size={15} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <div className="quote-line" />
            <p>
              Cuidar das contas
              <br />é cuidar de você.
            </p>
            <span>UM DIA DE CADA VEZ.</span>
          </div>
          <div className="offline-badge">
            <span />
            100% no seu dispositivo
            <ShieldCheck size={15} />
          </div>
          <div className="sidebar-version">
            ContaCerta <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>Seu espaço financeiro</span>
          <div>
            <span className="local-pill">
              <span />
              Armazenamento local
            </span>
            <Link to="/ajustes" className="avatar" aria-label="Abrir ajustes">
              CC
            </Link>
          </div>
        </div>
        <main id="main-content" tabIndex={-1}>
          {error ? (
            <div className="card error-state">
              <h1>Vamos tentar novamente?</h1>
              <p>{error}</p>
              <button className="primary-button" onClick={() => void init()}>
                Tentar novamente
              </button>
            </div>
          ) : !ready ? (
            <div
              className="skeletons"
              aria-busy="true"
              aria-label="Carregando contas"
            >
              <div />
              <div />
              <div />
            </div>
          ) : (
            <div className="page-content" key={location.pathname}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/contas" element={<Bills />} />
                <Route path="/calendario" element={<Calendar />} />
                <Route path="/ajustes" element={<Settings />} />
                <Route path="/nova" element={<BillForm />} />
                <Route path="/editar/:id" element={<BillForm />} />
                <Route path="/conta/:id" element={<Details />} />
                <Route
                  path="*"
                  element={
                    <div className="empty">
                      <h1>Página não encontrada</h1>
                      <Link to="/">Voltar ao início</Link>
                    </div>
                  }
                />
              </Routes>
              {data.settings.demo && (
                <div className="demo-notice">
                  Você está explorando dados de demonstração.{" "}
                  <Link to="/ajustes">
                    Começar do zero <ChevronRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
        <footer className="desktop-footer">
          <span>Mais clareza para o seu dia a dia.</span>
          <span>ContaCerta © {new Date().getFullYear()}</span>
        </footer>
      </div>
      <nav className="tabbar" aria-label="Navegação inferior">
        {navigation.map(([to, label, Icon]) => (
          <NavLink end={to === "/"} to={to} key={to}>
            <Icon size={23} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
export default function App() {
  return (
    <HashRouter>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <Shell />
    </HashRouter>
  );
}
