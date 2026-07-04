import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, UnauthorizedError } from "../api/client";
import type { EntityConfig } from "../api/entities";

interface RelationOptions {
  [resource: string]: Array<{ id: string; label: string }>;
}

export function EntityListPage({ config }: { config: EntityConfig }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [relationOptions, setRelationOptions] = useState<RelationOptions>({});
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await api.list(config.key);
      setItems(data);
    } catch (e) {
      if (e instanceof UnauthorizedError) return navigate("/login", { replace: true });
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    setForm({});
    setError(null);

    const relationFields = config.fields.filter((f) => f.type === "relation");
    Promise.all(
      relationFields.map((f) =>
        api.list(f.relation!.resource).then((data) => [f.relation!.resource, data] as const)
      )
    ).then((pairs) => {
      const opts: RelationOptions = {};
      for (const [resource, data] of pairs) {
        opts[resource] = data.map((d: any) => ({
          id: d.id,
          label: d[config.fields.find((f) => f.relation?.resource === resource)!.relation!.labelKey],
        }));
      }
      setRelationOptions(opts);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of config.fields) {
        const value = form[field.key];
        if (value === undefined || value === "") continue;
        payload[field.key] = field.type === "number" ? Number(value) : value;
      }
      await api.create(config.key, payload);
      setForm({});
      reload();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await api.remove(config.key, id);
    reload();
  }

  return (
    <div>
      <h2>{config.label}</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="entity-form">
        {config.fields.map((field) => (
          <label key={field.key}>
            {field.label}
            {field.type === "relation" ? (
              <select
                required={field.required}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              >
                <option value="" disabled>
                  Select {field.label.toLowerCase()}
                </option>
                {(relationOptions[field.relation!.resource] ?? []).map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              >
                <option value="" disabled>
                  Select
                </option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                required={field.required}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              />
            ) : (
              <input
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                required={field.required}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              />
            )}
          </label>
        ))}
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              {config.fields.map((field) => (
                <th key={field.key}>{field.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {config.fields.map((field) => (
                  <td key={field.key}>
                    {field.listValue ? field.listValue(item) : String(item[field.key] ?? "")}
                  </td>
                ))}
                <td>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
