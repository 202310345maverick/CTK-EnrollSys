import { NextRequest, NextResponse } from "next/server";
import { getEmailConfig } from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const to = body?.to ?? process.env.TEST_EMAIL_TO ?? process.env.SMTP_USER;
    if (!to) {
      return NextResponse.json({ ok: false, error: "No recipient specified (provide 'to' in body or set TEST_EMAIL_TO/SMTP_USER)" }, { status: 400 });
    }
    const subject = body?.subject ?? "CTK EnrollSys SMTP Diagnostic";
    const message = body?.message ?? "This is a diagnostic test email from CTK EnrollSys.";

    const { transporter, from } = getEmailConfig();

    // Verify connection
    await transporter.verify();

    await transporter.sendMail({
      from,
      to,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    return NextResponse.json({ ok: true, to, message: "Test email sent" });
  } catch (err: any) {
    console.error("[/api/test-email] Error sending test email:", err);
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
