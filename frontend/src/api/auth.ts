export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OFFICE" | "TECHNICIAN";
}

async function handle(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const authApi = {
  login: (email: string, password: string): Promise<CurrentUser> =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle),
  logout: (): Promise<null> => fetch("/api/auth/logout", { method: "POST" }).then(handle),
  me: (): Promise<CurrentUser | null> =>
    fetch("/api/auth/me").then((res) => (res.status === 401 ? null : handle(res))),
};
