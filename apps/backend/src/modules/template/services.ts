import { templateRepo, type CreateTemplateInput, type UpdateTemplateInput } from "./repo";
import { logAccessViolation } from "../safety";

export const templateService = {
  async create(
    userId: string,
    data: Omit<CreateTemplateInput, "userId">,
  ) {
    if (data.isDefault) {
      await templateRepo.clearDefaultForUser(userId);
    }
    return templateRepo.create({ ...data, userId });
  },

  async getById(id: string, userId: string) {
    const preset = await templateRepo.getById(id);
    if (!preset) return null;
    if (preset.userId !== userId) {
      await logAccessViolation(userId, "template_preset", id);
      return null;
    }
    return preset;
  },

  async list(userId: string) {
    return templateRepo.listByUserId(userId);
  },

  async update(id: string, userId: string, data: UpdateTemplateInput) {
    const preset = await templateRepo.getById(id);
    if (!preset) return null;
    if (preset.userId !== userId) {
      await logAccessViolation(userId, "template_preset", id);
      return null;
    }

    if (data.isDefault) {
      await templateRepo.clearDefaultForUser(userId);
    }

    return templateRepo.update(id, userId, data);
  },

  async delete(id: string, userId: string) {
    const preset = await templateRepo.getById(id);
    if (!preset) return null;
    if (preset.userId !== userId) {
      await logAccessViolation(userId, "template_preset", id);
      return null;
    }
    return templateRepo.delete(id, userId);
  },

  async setDefault(id: string, userId: string) {
    const preset = await templateRepo.getById(id);
    if (!preset) return null;
    if (preset.userId !== userId) {
      await logAccessViolation(userId, "template_preset", id);
      return null;
    }

    await templateRepo.clearDefaultForUser(userId);
    return templateRepo.update(id, userId, { isDefault: true });
  },
};
