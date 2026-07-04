import request from "supertest";
import { app } from "../src/app";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "./globalSetup";

export async function adminAgent() {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });
  return agent;
}

export async function agentAs(email: string, password: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password });
  return agent;
}
