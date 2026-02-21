import * as chatRepo from "./repo";
import { messageGenerationQueue } from "../../queues";

export async function createChat(userId: string, title: string) {
  const [created] = await chatRepo.createChat(userId, title);
  return created;
}

export async function getUserChats(userId: string) {
  return chatRepo.listChatsByUser(userId);
}

export async function getChatWithMessages(chatId: string, userId: string) {
  const chatRecord = await chatRepo.getChatByIdForUser(chatId, userId);
  if (!chatRecord) {
    return null;
  }

  const messages = await chatRepo.getChatMessages(chatId);
  return { ...chatRecord, messages };
}

export async function sendMessage(
  chatId: string,
  userId: string,
  content: string,
) {
  const chatRecord = await chatRepo.getChatByIdForUser(chatId, userId);
  if (!chatRecord) {
    return null;
  }

  const [created] = await chatRepo.createMessage(chatId, "user", content);
  if (!created) {
    throw new Error("Failed to create message");
  }

  await messageGenerationQueue.add("generate", {
    chatId,
    messageId: created.id,
  });

  return created;
}
