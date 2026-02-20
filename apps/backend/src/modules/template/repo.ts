import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { templatePreset } from "../../db/schema";

export type CreateTemplateInput = {
  userId: string;
  name: string;
  tone?: string;
  knowledgeLevel?: string;
  outputFormat?: string;
  outputLanguage?: string;
  responseLength?: string;
  extraPreferences?: unknown;
  isDefault?: boolean;
};

export type UpdateTemplateInput = Partial<
  Omit<CreateTemplateInput, "userId">
>;

export const templateRepo = {
  async create(input: CreateTemplateInput) {
    const [row] = await db
      .insert(templatePreset)
      .values({
        userId: input.userId,
        name: input.name,
        tone: input.tone,
        knowledgeLevel: input.knowledgeLevel,
        outputFormat: input.outputFormat,
        outputLanguage: input.outputLanguage,
        responseLength: input.responseLength,
        extraPreferences: input.extraPreferences,
        isDefault: input.isDefault ?? false,
      })
      .returning();
    return row;
  },

  async getById(id: string) {
    return db.query.templatePreset.findFirst({
      where: eq(templatePreset.id, id),
    });
  },

  async listByUserId(userId: string) {
    return db.query.templatePreset.findMany({
      where: eq(templatePreset.userId, userId),
      orderBy: (t, { desc }) => desc(t.createdAt),
    });
  },

  async update(id: string, data: UpdateTemplateInput) {
    const [row] = await db
      .update(templatePreset)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(templatePreset.id, id))
      .returning();
    return row;
  },

  async delete(id: string) {
    const [row] = await db
      .delete(templatePreset)
      .where(eq(templatePreset.id, id))
      .returning();
    return row;
  },

  async clearDefaultForUser(userId: string) {
    await db
      .update(templatePreset)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(templatePreset.userId, userId),
          eq(templatePreset.isDefault, true),
        ),
      );
  },
};
