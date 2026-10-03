import { Resend } from "resend";

const isResendEnabled = () => Boolean(process.env.RESEND_API_KEY?.trim());

const createResendClient = () => {
  if (!isResendEnabled()) return null;
  return new Resend(process.env.RESEND_API_KEY.trim());
};

const BRAND_NAME = "Inspire Best Minds";
const FROM_ADDRESS =
  process.env.RESEND_FROM ||
  `${BRAND_NAME} <${process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev"}>`;

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isResendEnabled()) {
    console.log(
      `[Email Service (Simulated)] To: ${to} | Subject: ${subject}\n(Set RESEND_API_KEY in .env to send real emails via Resend)`
    );
    return { ok: true, simulated: true };
  }

  try {
    const client = createResendClient();
    const plainText = text || html.replace(/<[^>]*>/g, "");

    const response = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text: plainText,
    });

    return { ok: true, data: response };
  } catch (error) {
    console.error("[Email Service Error]:", error?.message || error);
    return { ok: false, error: error?.message || "Failed to send email" };
  }
};

const buildShell = ({ title, eyebrow, body, buttonLabel, buttonUrl }) => `
  <!DOCTYPE html>
  <html lang="ro">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { margin: 0; background: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrap { padding: 32px 16px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); }
        .hero { background: #111827; color: #ffffff; padding: 32px; }
        .hero h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .hero p { margin: 8px 0 0; color: #9ca3af; font-size: 14px; }
        .content { padding: 32px; color: #374151; line-height: 1.6; font-size: 15px; }
        .btn { display: inline-block; margin-top: 20px; background: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 8px; }
        .footer { background: #f9fafb; padding: 20px 32px; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card">
          <div class="hero">
            <div style="font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#60a5fa;margin-bottom:6px;">${BRAND_NAME}</div>
            <h1>${title}</h1>
            <p>${eyebrow}</p>
          </div>
          <div class="content">
            ${body}
            ${buttonLabel && buttonUrl ? `<a class="btn" href="${buttonUrl}">${buttonLabel}</a>` : ""}
          </div>
          <div class="footer">© ${new Date().getFullYear()} ${BRAND_NAME}. Toate drepturile rezervate.</div>
        </div>
      </div>
    </body>
  </html>
`;

export const sendPasswordResetEmail = async (user, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetURL = `${clientUrl}/reset-password?token=${resetToken}`;
  const html = buildShell({
    title: "Resetare parolă cont",
    eyebrow: "Cerere de resetare a parolei",
    body: `
      <p>Salut <strong>${user.name || "Utilizator"}</strong>,</p>
      <p>Am primit o solicitare de resetare a parolei pentru contul tău. Apasă butonul de mai jos pentru a alege o nouă parolă.</p>
      <p>Acest link este valabil timp de <strong>10 minute</strong>. Dacă nu ai solicitat resetarea, poți ignora acest mesaj.</p>
    `,
    buttonLabel: "Resetează Parola",
    buttonUrl: resetURL,
  });

  return sendEmail({
    to: user.email,
    subject: `Resetare parolă cont (valabil 10 min)`,
    html,
  });
};
