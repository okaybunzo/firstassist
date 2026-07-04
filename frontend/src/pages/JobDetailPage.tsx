import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AttachmentGallery } from "../components/AttachmentGallery";

interface FormField {
  id: string;
  label: string;
  fieldType: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "PHOTO";
  options: string | null;
  order: number;
}

interface InspectionForm {
  id: string;
  name: string;
  fields: FormField[];
}

interface ChecklistAnswer {
  fieldId: string;
  value: string | null;
}

interface ChecklistResult {
  id: string;
  submittedAt: string;
  submittedBy: string | null;
  form: InspectionForm;
  answers: ChecklistAnswer[];
}

interface Issue {
  id: string;
  description: string;
  severity: string;
  status: string;
}

interface Report {
  id: string;
  fileName: string;
  filePath: string;
  generatedAt: string;
}

interface Job {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string | null;
  site: { name: string; address: string | null; client: { name: string } };
  asset: { name: string; assetType: string | null } | null;
  assignedTo: { id: string; name: string } | null;
  issues: Issue[];
  checklistResults: ChecklistResult[];
  reports: Report[];
}

interface UserOption {
  id: string;
  name: string;
  role: string;
}

const JOB_STATUSES = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const ISSUE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [forms, setForms] = useState<InspectionForm[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canAllocate = user?.role === "ADMIN" || user?.role === "OFFICE";

  // Job summary edit state
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  // Checklist state
  const [selectedFormId, setSelectedFormId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Issue state
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("MEDIUM");

  // Report state
  const [generating, setGenerating] = useState(false);

  async function reload() {
    const data: Job = await api.get("jobs", id!);
    setJob(data);
    setStatus(data.status);
    setNotes(data.notes ?? "");
    setCompletedDate(data.completedDate ? data.completedDate.slice(0, 10) : "");
    setAssignedToId(data.assignedTo?.id ?? "");
  }

  useEffect(() => {
    reload();
    api.list("inspection-forms").then(setForms);
    if (canAllocate) api.list("users").then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSaveSummary(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.update("jobs", id!, {
        status,
        notes: notes || null,
        completedDate: completedDate ? new Date(completedDate).toISOString() : null,
        ...(canAllocate ? { assignedToId: assignedToId || null } : {}),
      });
      reload();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleSubmitChecklist(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const form = forms.find((f) => f.id === selectedFormId);
    if (!form) return;
    try {
      await api.create("checklist-results", {
        jobId: id,
        formId: form.id,
        submittedBy: user?.name,
        answers: { create: form.fields.map((f) => ({ fieldId: f.id, value: answers[f.id] ?? "" })) },
      });
      setSelectedFormId("");
      setAnswers({});
      reload();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleAddIssue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.create("issues", {
        jobId: id,
        description: issueDescription,
        severity: issueSeverity,
        status: "OPEN",
      });
      setIssueDescription("");
      setIssueSeverity("MEDIUM");
      reload();
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleDeleteIssue(issueId: string) {
    if (!confirm("Delete this issue?")) return;
    await api.remove("issues", issueId);
    reload();
  }

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      await fetch(`/api/reports/jobs/${id}`, { method: "POST" });
      reload();
    } finally {
      setGenerating(false);
    }
  }

  if (!job) return <p>Loading…</p>;

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  return (
    <div>
      <p>
        <Link to="/jobs">&larr; All jobs</Link>
      </p>
      <h2>{job.title}</h2>
      {error && <p className="error">{error}</p>}

      <div className="detail-section">
        <dl className="summary">
          <dt>Client</dt>
          <dd>{job.site.client.name}</dd>
          <dt>Site</dt>
          <dd>
            {job.site.name}
            {job.site.address ? ` — ${job.site.address}` : ""}
          </dd>
          {job.asset && (
            <>
              <dt>Asset</dt>
              <dd>{job.asset.name}</dd>
            </>
          )}
          <dt>Type</dt>
          <dd>
            <span className="badge">{job.type}</span>
          </dd>
          <dt>Assigned to</dt>
          <dd>{job.assignedTo?.name ?? "Unassigned"}</dd>
        </dl>

        <form onSubmit={handleSaveSummary} className="inline-form">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Completed date
            <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
          </label>
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {canAllocate && (
            <label>
              Assigned to
              <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit">Save</button>
        </form>
      </div>

      <div className="detail-section">
        <h3>Inspection checklist</h3>
        <form onSubmit={handleSubmitChecklist} className="inline-form">
          <label>
            Form
            <select value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)}>
              <option value="">Select a form…</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </form>

        {selectedForm && (
          <form onSubmit={handleSubmitChecklist} className="inline-form">
            {selectedForm.fields.map((field) => (
              <label key={field.id}>
                {field.label}
                {field.fieldType === "BOOLEAN" ? (
                  <input
                    type="checkbox"
                    checked={answers[field.id] === "true"}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: String(e.target.checked) })}
                  />
                ) : field.fieldType === "SELECT" ? (
                  <select
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {(field.options ?? "").split(",").map((opt) => (
                      <option key={opt.trim()} value={opt.trim()}>
                        {opt.trim()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.fieldType === "NUMBER" ? "number" : "text"}
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <button type="submit">Submit checklist</button>
          </form>
        )}

        {job.checklistResults.map((result) => (
          <div key={result.id} className="detail-section">
            <strong>{result.form.name}</strong> — {new Date(result.submittedAt).toLocaleString()}
            {result.submittedBy ? ` (${result.submittedBy})` : ""}
            <ul>
              {result.form.fields.map((field) => {
                const answer = result.answers.find((a) => a.fieldId === field.id);
                return (
                  <li key={field.id}>
                    {field.label}: {answer?.value ?? "-"}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h3>Issues</h3>
        <form onSubmit={handleAddIssue} className="inline-form">
          <label>
            Description
            <textarea required value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} />
          </label>
          <label>
            Severity
            <select value={issueSeverity} onChange={(e) => setIssueSeverity(e.target.value)}>
              {ISSUE_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Add issue</button>
        </form>

        {job.issues.map((issue) => (
          <div key={issue.id} className="detail-section">
            <span className="badge">{issue.severity}</span> <span className="badge">{issue.status}</span>
            <p>{issue.description}</p>
            <AttachmentGallery scope={{ issueId: issue.id }} />
            <button onClick={() => handleDeleteIssue(issue.id)}>Delete issue</button>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h3>Job photos</h3>
        <AttachmentGallery scope={{ jobId: job.id }} />
      </div>

      <div className="detail-section">
        <h3>Maintenance report</h3>
        <button onClick={handleGenerateReport} disabled={generating}>
          {generating ? "Generating…" : "Generate PDF report"}
        </button>
        <ul>
          {job.reports.map((report) => (
            <li key={report.id}>
              <a href={`/uploads/${report.filePath}`} target="_blank" rel="noreferrer">
                {report.fileName}
              </a>{" "}
              — {new Date(report.generatedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
