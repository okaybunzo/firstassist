import { describe, expect, it } from "vitest";
import { adminAgent } from "./helpers";

describe("clients CRUD", () => {
  it("creates, lists, updates, and deletes a client", async () => {
    const agent = await adminAgent();

    const created = await agent.post("/api/clients").send({ name: "Test Client Co", email: "a@b.com" });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await agent.get("/api/clients");
    expect(list.status).toBe(200);
    expect(list.body.some((c: { id: string }) => c.id === id)).toBe(true);

    const updated = await agent.put(`/api/clients/${id}`).send({ name: "Renamed Client Co" });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe("Renamed Client Co");

    const deleted = await agent.delete(`/api/clients/${id}`);
    expect(deleted.status).toBe(204);

    const afterDelete = await agent.get(`/api/clients/${id}`);
    expect(afterDelete.status).toBe(404);
  });
});
