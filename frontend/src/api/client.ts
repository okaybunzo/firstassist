const API_BASE = "/api";

export class UnauthorizedError extends Error {}

async function handle(res: Response) {
  if (res.status === 401) {
    throw new UnauthorizedError("Not authenticated");
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  list: (resource: string) => fetch(`${API_BASE}/${resource}`).then(handle),
  get: (resource: string, id: string) => fetch(`${API_BASE}/${resource}/${id}`).then(handle),
  create: (resource: string, data: unknown) =>
    fetch(`${API_BASE}/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  update: (resource: string, id: string, data: unknown) =>
    fetch(`${API_BASE}/${resource}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  remove: (resource: string, id: string) =>
    fetch(`${API_BASE}/${resource}/${id}`, { method: "DELETE" }).then(handle),
  upload: (resource: string, formData: FormData) =>
    fetch(`${API_BASE}/${resource}`, { method: "POST", body: formData }).then(handle),
};
