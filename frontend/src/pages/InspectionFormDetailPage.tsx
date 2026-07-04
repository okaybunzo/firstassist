import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  options: string | null;
  order: number;
}

interface InspectionForm {
  id: string;
  name: string;
  description: string | null;
  fields: FormField[];
}

const FIELD_TYPES = ["TEXT", "NUMBER", "BOOLEAN", "SELECT", "PHOTO"];

export function InspectionFormDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<InspectionForm | null>(null);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [options, setOptions] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await api.get("inspection-forms", id!);
    setForm(data);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.create("inspection-form-fields", {
        formId: id,
        label,
        fieldType,
        options: fieldType === "SELECT" ? options : undefined,
        order: form?.fields.length ?? 0,
      });
      setLabel("");
      setOptions("");
      setFieldType("TEXT");
      reload();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm("Delete this field?")) return;
    await api.remove("inspection-form-fields", fieldId);
    reload();
  }

  if (!form) return <p>Loading…</p>;

  return (
    <div>
      <p>
        <Link to="/inspection-forms">&larr; All inspection forms</Link>
      </p>
      <h2>{form.name}</h2>
      {form.description && <p>{form.description}</p>}

      <div className="detail-section">
        <h3>Fields</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAddField} className="inline-form">
          <label>
            Label
            <input required value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label>
            Type
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {fieldType === "SELECT" && (
            <label>
              Options (comma separated)
              <input value={options} onChange={(e) => setOptions(e.target.value)} />
            </label>
          )}
          <button type="submit">Add field</button>
        </form>

        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Label</th>
              <th>Type</th>
              <th>Options</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {form.fields.map((f) => (
              <tr key={f.id}>
                <td>{f.order}</td>
                <td>{f.label}</td>
                <td>{f.fieldType}</td>
                <td>{f.options}</td>
                <td>
                  <button onClick={() => handleDeleteField(f.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
