import { NavLink, Route, Routes } from "react-router-dom";
import { entities } from "./api/entities";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { RequireAuth } from "./auth/RequireAuth";
import { EntityListPage } from "./components/EntityListPage";
import { JobsPage } from "./pages/JobsPage";
import { PartsPage } from "./pages/PartsPage";
import { QuoteItemsPage } from "./pages/QuoteItemsPage";

const simpleEntityKeys = ["clients", "sites", "assets", "maintenance-schedules", "issues"];

function Shell() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <nav>
        <h1>FirstAssist</h1>
        <NavLink to="/" end>
          Clients
        </NavLink>
        <NavLink to="/sites">Sites</NavLink>
        <NavLink to="/assets">Assets</NavLink>
        <NavLink to="/maintenance-schedules">Maintenance</NavLink>
        <NavLink to="/jobs">Jobs</NavLink>
        <NavLink to="/issues">Issues</NavLink>
        <NavLink to="/parts">Parts / Price List</NavLink>
        <NavLink to="/quote-items">Quote Items</NavLink>
        <div className="nav-user">
          <span>{user?.name}</span>
          <button onClick={() => logout()}>Log out</button>
        </div>
      </nav>
      <main>
        <Routes>
          {simpleEntityKeys.map((key) => {
            const config = entities.find((e) => e.key === key)!;
            const path = key === "clients" ? "/" : `/${key}`;
            return <Route key={key} path={path} element={<EntityListPage config={config} />} />;
          })}
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/parts" element={<PartsPage />} />
          <Route path="/quote-items" element={<QuoteItemsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
