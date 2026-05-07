import dbConnect from "@/lib/db/connection";
import AuditLog from "@/models/AuditLog";

export async function createAuditLog(data: {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "UPLOAD" | "DOWNLOAD" | "APPROVE" | "REJECT" | "VERIFY" | "VOID" | "VIEW";
  resource: "USER" | "STUDENT" | "ENROLLMENT" | "PAYMENT" | "DOCUMENT" | "SCHOOL_YEAR" | "FEE_STRUCTURE" | "AUTH";
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await dbConnect();
    await AuditLog.create(data);
  } catch (error) {
    console.error("[audit] Failed to create audit log:", error);
  }
}
