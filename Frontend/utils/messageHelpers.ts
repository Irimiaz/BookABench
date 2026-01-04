import { setData } from "./exportHelpers";

export type CreateMessageData = {
  userId: string;
  title: string;
  content: string;
};

/**
 * Create a new message in the messages collection
 */
export async function createMessage(data: CreateMessageData): Promise<void> {
  if (!data.userId) {
    console.error("[createMessage] Missing userId:", data);
    throw new Error("userId is required to create a message");
  }
  if (!data.title || !data.content) {
    console.error("[createMessage] Missing title or content:", data);
    throw new Error("title and content are required to create a message");
  }

  try {
    console.log("[createMessage] Creating message:", {
      userId: data.userId,
      title: data.title,
      content: data.content.substring(0, 50) + "...",
    });

    const messageData = {
      userId: data.userId,
      title: data.title,
      content: data.content,
      isOpened: false,
      createdAt: new Date().toISOString(),
    };

    console.log("[createMessage] Calling setData with:", {
      collection: "messages",
      messageData,
    });

    const result = await setData("messages", messageData);

    console.log("[createMessage] setData response:", result);
    console.log("[createMessage] Message created successfully");

    // Verify the message was actually saved
    if (!result) {
      console.warn("[createMessage] setData returned no result");
    }
  } catch (error) {
    console.error("[createMessage] Failed to create message:", error);
    if (error instanceof Error) {
      console.error("[createMessage] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("[createMessage] Unknown error type:", error);
    }
    throw error;
  }
}
