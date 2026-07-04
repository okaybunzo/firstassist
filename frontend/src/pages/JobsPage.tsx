import { entities } from "../api/entities";
import { EntityListPage } from "../components/EntityListPage";

const jobsConfig = entities.find((e) => e.key === "jobs")!;

export function JobsPage() {
  return <EntityListPage config={jobsConfig} linkTo={(item) => `/jobs/${item.id}`} />;
}
