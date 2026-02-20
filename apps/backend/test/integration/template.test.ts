import { describe, it, expect } from "bun:test";
import { createTestApp, request } from "../testkit";

function extractCookies(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

const userA = {
  name: "User A",
  email: "usera-template@example.com",
  password: "securePassword123",
};

const userB = {
  name: "User B",
  email: "userb-template@example.com",
  password: "securePassword123",
};

async function signUp(app: { handle: (req: Request) => Response | Promise<Response> }, user: typeof userA) {
  const res = await request(app, {
    method: "POST",
    path: "/api/auth/sign-up/email",
    body: user,
  });
  return extractCookies(res);
}

describe("TemplatePreset CRUD", () => {
  it("should create a template preset", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const res = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Дружелюбный", tone: "friendly", responseLength: "short" },
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Дружелюбный");
    expect(data.tone).toBe("friendly");
    expect(data.responseLength).toBe("short");
    expect(data.isDefault).toBe(false);
  });

  it("should create a template with default flag", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const res = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Default Template", isDefault: true },
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isDefault).toBe(true);
  });

  it("should reject unauthenticated request with 401", async () => {
    const app = await createTestApp();

    const res = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Test" },
    });

    expect(res.status).toBe(401);
  });

  it("should list user templates", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Template 1" },
      headers: { Cookie: cookies },
    });
    await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Template 2" },
      headers: { Cookie: cookies },
    });

    const res = await request(app, {
      path: "/templates",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
  });

  it("should get a template by id", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const createRes = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "My Preset" },
      headers: { Cookie: cookies },
    });
    const created = await createRes.json();

    const res = await request(app, {
      path: `/templates/${created.id}`,
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(created.id);
    expect(data.name).toBe("My Preset");
  });

  it("should update a template", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const createRes = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Old Name", tone: "formal" },
      headers: { Cookie: cookies },
    });
    const created = await createRes.json();

    const res = await request(app, {
      method: "PATCH",
      path: `/templates/${created.id}`,
      body: { name: "New Name", tone: "friendly" },
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("New Name");
    expect(data.tone).toBe("friendly");
  });

  it("should delete a template", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const createRes = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "To Delete" },
      headers: { Cookie: cookies },
    });
    const created = await createRes.json();

    const delRes = await request(app, {
      method: "DELETE",
      path: `/templates/${created.id}`,
      headers: { Cookie: cookies },
    });
    expect(delRes.status).toBe(200);

    const getRes = await request(app, {
      path: `/templates/${created.id}`,
      headers: { Cookie: cookies },
    });
    expect(getRes.status).toBe(404);
  });

  it("should return 404 for non-existent template", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const res = await request(app, {
      path: "/templates/00000000-0000-0000-0000-000000000000",
      headers: { Cookie: cookies },
    });

    expect(res.status).toBe(404);
  });
});

describe("TemplatePreset default management", () => {
  it("should set exactly one template as default", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    // Create two templates
    const res1 = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Template 1", isDefault: true },
      headers: { Cookie: cookies },
    });
    const t1 = await res1.json();

    const res2 = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Template 2", isDefault: true },
      headers: { Cookie: cookies },
    });
    const t2 = await res2.json();

    // Template 2 should be default, Template 1 should not
    const get1 = await request(app, {
      path: `/templates/${t1.id}`,
      headers: { Cookie: cookies },
    });
    const data1 = await get1.json();
    expect(data1.isDefault).toBe(false);

    const get2 = await request(app, {
      path: `/templates/${t2.id}`,
      headers: { Cookie: cookies },
    });
    const data2 = await get2.json();
    expect(data2.isDefault).toBe(true);
  });

  it("should switch default via POST /:id/default", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const res1 = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Template A", isDefault: true },
      headers: { Cookie: cookies },
    });
    const t1 = await res1.json();

    const res2 = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Template B" },
      headers: { Cookie: cookies },
    });
    const t2 = await res2.json();

    // Set Template B as default
    const setRes = await request(app, {
      method: "POST",
      path: `/templates/${t2.id}/default`,
      headers: { Cookie: cookies },
    });
    expect(setRes.status).toBe(200);
    const setData = await setRes.json();
    expect(setData.isDefault).toBe(true);

    // Template A should no longer be default
    const get1 = await request(app, {
      path: `/templates/${t1.id}`,
      headers: { Cookie: cookies },
    });
    const data1 = await get1.json();
    expect(data1.isDefault).toBe(false);
  });

  it("should switch default via PATCH update with isDefault", async () => {
    const app = await createTestApp();
    const cookies = await signUp(app, userA);

    const res1 = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "Original Default", isDefault: true },
      headers: { Cookie: cookies },
    });
    await res1.json();

    const res2 = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "New Default" },
      headers: { Cookie: cookies },
    });
    const t2 = await res2.json();

    // Update Template 2 to be default
    await request(app, {
      method: "PATCH",
      path: `/templates/${t2.id}`,
      body: { isDefault: true },
      headers: { Cookie: cookies },
    });

    // Verify only Template 2 is default
    const list = await request(app, {
      path: "/templates",
      headers: { Cookie: cookies },
    });
    const templates: { id: string; isDefault: boolean }[] = await list.json();
    const defaults = templates.filter((t) => t.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(t2.id);
  });
});

describe("TemplatePreset user isolation", () => {
  it("should not allow user to access another user's template", async () => {
    const app = await createTestApp();
    const cookiesA = await signUp(app, userA);
    const cookiesB = await signUp(app, userB);

    // User A creates template
    const createRes = await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "User A's template" },
      headers: { Cookie: cookiesA },
    });
    const template = await createRes.json();

    // User B tries to get it
    const getRes = await request(app, {
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesB },
    });
    expect(getRes.status).toBe(404);

    // User B tries to update it
    const patchRes = await request(app, {
      method: "PATCH",
      path: `/templates/${template.id}`,
      body: { name: "Hacked" },
      headers: { Cookie: cookiesB },
    });
    expect(patchRes.status).toBe(404);

    // User B tries to delete it
    const delRes = await request(app, {
      method: "DELETE",
      path: `/templates/${template.id}`,
      headers: { Cookie: cookiesB },
    });
    expect(delRes.status).toBe(404);

    // User B tries to set it as their default
    const defRes = await request(app, {
      method: "POST",
      path: `/templates/${template.id}/default`,
      headers: { Cookie: cookiesB },
    });
    expect(defRes.status).toBe(404);
  });

  it("should list only own templates", async () => {
    const app = await createTestApp();
    const cookiesA = await signUp(app, userA);
    const cookiesB = await signUp(app, userB);

    await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "A's template" },
      headers: { Cookie: cookiesA },
    });

    await request(app, {
      method: "POST",
      path: "/templates",
      body: { name: "B's template" },
      headers: { Cookie: cookiesB },
    });

    const listA = await request(app, {
      path: "/templates",
      headers: { Cookie: cookiesA },
    });
    const dataA = await listA.json();
    expect(dataA).toHaveLength(1);
    expect(dataA[0].name).toBe("A's template");

    const listB = await request(app, {
      path: "/templates",
      headers: { Cookie: cookiesB },
    });
    const dataB = await listB.json();
    expect(dataB).toHaveLength(1);
    expect(dataB[0].name).toBe("B's template");
  });
});
