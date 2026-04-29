import nodemailer, { Transporter } from 'nodemailer';

let cached: Transporter | null = null;

export function getMailer(): Transporter {
  if (cached) return cached;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set');
  }
  cached = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return cached;
}

export function getFromAddress(): string {
  const user = process.env.GMAIL_USER;
  if (!user) throw new Error('GMAIL_USER not set');
  return `Roasting Warehouse <${user}>`;
}
