import { useState } from "react";
import { entities } from "../api/entities";
import { EntityListPage } from "../components/EntityListPage";

const partsConfig = entities.find((e) => e.key === "parts")!;

export function PartsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("Importing…");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/parts/import", { method: "POST", body: formData });
    if (!res.ok) {
      setStatus(`Import failed: ${await res.text()}`);
      return;
    }
    const data = await res.json();
    setStatus(`Imported ${data.imported} parts.`);
    window.location.reload();
  }

  return (
    <div>
      <form onSubmit={handleImport} className="import-form">
        <h3>Import master price list (Excel)</h3>
        <p>Expected columns: sku, name, description, unit, unitPrice, category.</p>
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit">Import</button>
        {status && <span> {status}</span>}
      </form>
      <EntityListPage config={partsConfig} />
    </div>
  );
}
