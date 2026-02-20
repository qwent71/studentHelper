import { templateRepo, type CreateTemplateInput, type UpdateTemplateInput } from "./repo";

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
    if (!preset || preset.userId !== userId) return null;
    return preset;
  },

  async list(userId: string) {
    return templateRepo.listByUserId(userId);
  },

  async update(id: string, userId: string, data: UpdateTemplateInput) {
    const preset = await templateRepo.getById(id);
    if (!preset || preset.userId !== userId) return null;

    if (data.isDefault) {
      await templateRepo.clearDefaultForUser(userId);
    }

    return templateRepo.update(id, data);
  },

  async delete(id: string, userId: string) {
    const preset = await templateRepo.getById(id);
    if (!preset || preset.userId !== userId) return null;
    return templateRepo.delete(id);
  },

  async setDefault(id: string, userId: string) {
    const preset = await templateRepo.getById(id);
    if (!preset || preset.userId !== userId) return null;

    await templateRepo.clearDefaultForUser(userId);
    return templateRepo.update(id, { isDefault: true });
  },
};
