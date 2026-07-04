import { entities } from "../api/entities";
import { EntityListPage } from "../components/EntityListPage";

const config = entities.find((e) => e.key === "inspection-forms")!;

export function InspectionFormsPage() {
  return <EntityListPage config={config} linkTo={(item) => `/inspection-forms/${item.id}`} />;
}
