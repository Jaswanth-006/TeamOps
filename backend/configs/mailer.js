import nodemailer from "nodemailer";

// Best-effort transactional email. If SMTP is not configured, sending is a no-op
// so the app runs fully without an email provider. Sending never throws to the
// caller: email is a side effect and must not fail the request that triggered it.
//
// SMTP credentials come from the environment now and will later be sourced from
// a secrets manager, the same seam as the database credentials.

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured; skipping email to ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "TeamOps <no-reply@teamops.local>",
      to,
      subject,
      text,
    });
  } catch (error) {
    // Log and move on — a mail failure must not affect the request.
    console.error("[mailer] failed to send email:", error.message);
  }
}
