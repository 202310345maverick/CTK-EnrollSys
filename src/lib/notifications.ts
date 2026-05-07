import mongoose from "mongoose";
import dbConnect from "@/lib/db/connection";
import Notification from "@/models/Notification";

export async function createNotification(data: {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  link?: string;
}): Promise<void> {
  try {
    await dbConnect();
    await Notification.create(data);
  } catch (error) {
    console.error("[createNotification] Failed to create notification:", error);
  }
}
