import { Elysia, t } from "elysia";
import { authGuardPlugin } from "../../plugins/auth";
import { templateService } from "./services";

export const templateRoutes = new Elysia({ prefix: "/templates" })
  .use(authGuardPlugin)
  // ── Create template ──
  .post(
    "/",
    async ({ body, user }) => {
      const preset = await templateService.create(user.id, body);
      return preset;
    },
    {
      auth: true,
      body: t.Object({
        name: t.String(),
        tone: t.Optional(t.String()),
        knowledgeLevel: t.Optional(t.String()),
        outputFormat: t.Optional(t.String()),
        outputLanguage: t.Optional(t.String()),
        responseLength: t.Optional(t.String()),
        extraPreferences: t.Optional(t.Unknown()),
        isDefault: t.Optional(t.Boolean()),
      }),
    },
  )
  // ── List templates ──
  .get(
    "/",
    async ({ user }) => {
      return templateService.list(user.id);
    },
    { auth: true },
  )
  // ── Get template ──
  .get(
    "/:id",
    async ({ params, user, status }) => {
      const preset = await templateService.getById(params.id, user.id);
      if (!preset) return status(404, { error: "Template not found" });
      return preset;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
    },
  )
  // ── Update template ──
  .patch(
    "/:id",
    async ({ params, body, user, status }) => {
      const preset = await templateService.update(params.id, user.id, body);
      if (!preset) return status(404, { error: "Template not found" });
      return preset;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        tone: t.Optional(t.String()),
        knowledgeLevel: t.Optional(t.String()),
        outputFormat: t.Optional(t.String()),
        outputLanguage: t.Optional(t.String()),
        responseLength: t.Optional(t.String()),
        extraPreferences: t.Optional(t.Unknown()),
        isDefault: t.Optional(t.Boolean()),
      }),
    },
  )
  // ── Delete template ──
  .delete(
    "/:id",
    async ({ params, user, status }) => {
      const preset = await templateService.delete(params.id, user.id);
      if (!preset) return status(404, { error: "Template not found" });
      return preset;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
    },
  )
  // ── Set default template ──
  .post(
    "/:id/default",
    async ({ params, user, status }) => {
      const preset = await templateService.setDefault(params.id, user.id);
      if (!preset) return status(404, { error: "Template not found" });
      return preset;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
    },
  );
