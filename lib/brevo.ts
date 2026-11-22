/**
 * Brevo Transactional Email Service (TypeScript Definitions)
 * The 1st Step Method
 */

export interface BrevoEmailOptions {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  replyTo?: string;
}

export interface BrevoEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PaidWelcomeEmailOptions {
  toEmail: string;
  toName?: string;
  seatNumber?: string;
  reference?: string;
}

export interface FreeSeatEmailOptions {
  toEmail: string;
  toName?: string;
  seatNumber?: string;
}

export interface ContactNotificationOptions {
  fromName?: string;
  fromEmail: string;
  message: string;
}

// Re-export implementations from brevo.js
const brevo = require('./brevo.js');

export const sendBrevoEmail: (options: BrevoEmailOptions) => Promise<BrevoEmailResponse> = brevo.sendBrevoEmail;
export const sendPaidWelcomeEmail: (options: PaidWelcomeEmailOptions) => Promise<BrevoEmailResponse> = brevo.sendPaidWelcomeEmail;
export const sendFreeSeatEmail: (options: FreeSeatEmailOptions) => Promise<BrevoEmailResponse> = brevo.sendFreeSeatEmail;
export const sendContactNotificationEmail: (options: ContactNotificationOptions) => Promise<{
  adminNotification: BrevoEmailResponse;
  visitorAutoReply: BrevoEmailResponse;
}> = brevo.sendContactNotificationEmail;

export default {
  sendBrevoEmail,
  sendPaidWelcomeEmail,
  sendFreeSeatEmail,
  sendContactNotificationEmail,
};
