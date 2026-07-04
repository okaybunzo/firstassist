import { NavLink, Route, Routes } from "react-router-dom";
import { entities } from "./api/entities";
import { EntityListPage } from "./components/EntityListPage";
import { JobsPage } from "./pages/JobsPage";
import { PartsPage } from "./pages/PartsPage";
import { QuoteItemsPage } from "./pages/QuoteItemsPage";

const simpleEntityKeys = ["clients", "sites", "assets", "maintenance-schedules", "issues"];

export default function App() {
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
