import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface JobRow {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: string | null;
  site: { name: string; client: { name: string } };
}

export function MyJobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);

  useEffect(() => {
    api.list("jobs").then(setJobs);
  }, []);

  return (
    <div>
      <h2>My Jobs</h2>
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Site</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Scheduled</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.site.client.name}</td>
              <td>{job.site.name}</td>
              <td>{job.title}</td>
              <td>{job.type}</td>
              <td>
                <span className="badge">{job.status}</span>
              </td>
              <td>{job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : "-"}</td>
              <td>
                <Link to={`/jobs/${job.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && <p>No jobs assigned to you yet.</p>}
    </div>
  );
}
