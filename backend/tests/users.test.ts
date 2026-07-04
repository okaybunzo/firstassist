import { describe, expect, it } from "vitest";
import { adminAgent } from "./helpers";

describe("users management (admin-only)", () => {
  it("lets an admin create a user without leaking the password hash", async () => {
    const agent = await adminAgent();

    const created = await agent
      .post("/api/users")
      .send({ name: "Office Person", email: "office-test@example.com", password: "secret123", role: "OFFICE" });
    expect(created.status).toBe(201);
    expect(created.body.passwordHash).toBeUndefined();
    expect(created.body.role).toBe("OFFICE");
  });

  it("blocks a non-admin from creating a user", async () => {
    const agent = await adminAgent();
    await agent
      .post("/api/users")
      .send({ name: "Tech", email: "tech-test@example.com", password: "secret123", role: "TECHNICIAN" });

    const techLogin = await agent.post("/api/auth/login").send({ email: "tech-test@example.com", password: "secret123" });
    expect(techLogin.status).toBe(200);

    const res = await agent
      .post("/api/users")
      .send({ name: "Blocked", email: "blocked@example.com", password: "secret123", role: "OFFICE" });
    expect(res.status).toBe(403);
  });
});
