import { useEffect, useState } from "react";
import { api } from "../api/client";
import { entities } from "../api/entities";
import { EntityListPage } from "../components/EntityListPage";

const jobsConfig = entities.find((e) => e.key === "jobs")!;

export function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function reload() {
    const [jobsData, reportsData] = await Promise.all([api.list("jobs"), api.list("reports")]);
    setJobs(jobsData);
    setReports(reportsData);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJobId) return;
    setStatus("Generating…");
    await fetch(`/api/reports/jobs/${selectedJobId}`, { method: "POST" });
    setStatus("Report generated.");
    reload();
  }

  return (
    <div>
      <div className="page-actions">
        <h3>Generate maintenance report (PDF)</h3>
        <form onSubmit={handleGenerate}>
          <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} required>
            <option value="" disabled>
              Select a completed job
            </option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.status}
              </option>
            ))}
          </select>
          <button type="submit">Generate report</button>
          {status && <span> {status}</span>}
        </form>

        {reports.length > 0 && (
          <ul>
            {reports.map((report) => (
              <li key={report.id}>
                <a href={`/uploads/${report.filePath}`} target="_blank" rel="noreferrer">
                  {report.fileName}
                </a>{" "}
                — {report.job?.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <EntityListPage config={jobsConfig} />
    </div>
  );
}
