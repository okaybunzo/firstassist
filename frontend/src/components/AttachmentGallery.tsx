import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Attachment {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  uploadedAt: string;
}

interface Scope {
  jobId?: string;
  assetId?: string;
  issueId?: string;
}

export function AttachmentGallery({ scope }: { scope: Scope }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams(scope as Record<string, string>).toString();

  async function reload() {
    const data = await api.list(`attachments?${query}`);
    setAttachments(data);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      for (const [key, value] of Object.entries(scope)) {
        if (value) formData.append(key, value);
      }
      await api.upload("attachments", formData);
      await reload();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo/attachment?")) return;
    await api.remove("attachments", id);
    reload();
  }

  return (
    <div className="attachment-gallery">
      <input type="file" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
      {error && <p className="error">{error}</p>}
      <div className="attachment-grid">
        {attachments.map((a) => (
          <div key={a.id} className="attachment-item">
            {a.mimeType?.startsWith("image/") ? (
              <a href={`/uploads/${a.filePath}`} target="_blank" rel="noreferrer">
                <img src={`/uploads/${a.filePath}`} alt={a.fileName} />
              </a>
            ) : (
              <a href={`/uploads/${a.filePath}`} target="_blank" rel="noreferrer">
                {a.fileName}
              </a>
            )}
            <button onClick={() => handleDelete(a.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
