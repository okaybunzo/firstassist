import { entities } from "../api/entities";
import { EntityListPage } from "../components/EntityListPage";

const quoteItemsConfig = entities.find((e) => e.key === "quote-items")!;

export function QuoteItemsPage() {
  return (
    <div>
      <div className="page-actions">
        <a href="/api/quote-items/export/xlsx">Export quote-ready items (XLSX)</a>
      </div>
      <EntityListPage config={quoteItemsConfig} />
    </div>
  );
}
