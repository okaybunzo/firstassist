import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "./globalSetup";

describe("auth", () => {
  it("rejects access to protected routes without a session", async () => {
    const res = await request(app).get("/api/clients");
    expect(res.status).toBe(401);
  });

  it("rejects a bad password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN_EMAIL, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("logs in, reads /me, and allows protected access, then logs out", async () => {
    const agent = request.agent(app);

    const login = await agent
      .post("/api/auth/login")
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe(TEST_ADMIN_EMAIL);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.role).toBe("ADMIN");

    const clients = await agent.get("/api/clients");
    expect(clients.status).toBe(200);

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(204);

    const afterLogout = await agent.get("/api/clients");
    expect(afterLogout.status).toBe(401);
  });
});
