/**
 * Brevo Transactional Email Service
 * The 1st Step Method
 * 
 * Uses native fetch() to call https://api.brevo.com/v3/smtp/email
 * Server-side only: process.env.BREVO_API_KEY is never exposed to the client.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const SENDER_NAME = 'The First Step Method';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'support@thefirststepmethod.com';

const COURSE_PORTAL_URL = process.env.COURSE_PORTAL_URL || 'https://the-1st-step-method.vercel.app#course';
const COMMUNITY_INVITE_URL = process.env.COMMUNITY_INVITE_URL || 'https://discord.gg/the1ststepmethod';
const FREE_RESOURCES_URL = process.env.FREE_RESOURCES_URL || 'https://the-1st-step-method.vercel.app#starter';

/**
 * Generic Brevo transactional email sender using native fetch()
 * 
 * @param {Object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} [options.toName] - Recipient full name
 * @param {string} options.subject - Email subject line
 * @param {string} options.htmlContent - Formatted HTML email body
 * @param {string} [options.replyTo] - Optional reply-to email address
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendBrevoEmail({ toEmail, toName, subject, htmlContent, replyTo }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    console.warn('[Brevo Email] Notice: BREVO_API_KEY is not set or in placeholder mode. Skipping live API call.');
    return { success: false, error: 'BREVO_API_KEY is not configured in environment variables' };
  }

  if (!toEmail || !toEmail.includes('@')) {
    console.warn('[Brevo Email] Invalid or missing recipient email address:', toEmail);
    return { success: false, error: 'Invalid recipient email' };
  }

  try {
    const payload = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: [
        {
          email: toEmail.trim(),
          name: toName ? toName.trim() : toEmail.trim(),
        },
      ],
      subject: subject,
      htmlContent: htmlContent,
    };

    if (replyTo && replyTo.includes('@')) {
      payload.replyTo = { email: replyTo.trim() };
    }

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[Brevo Email Error] HTTP ${response.status}:`, data);
      return {
        success: false,
        error: data.message || `Brevo API returned status ${response.status}`,
      };
    }

    console.log(`[Brevo Email Sent] Successfully delivered "${subject}" to ${toEmail}. ID: ${data.messageId || 'ok'}`);
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (err) {
    // Graceful error capture: never crash the Paystack webhook or user flow
    console.error('[Brevo Email Exception]:', err.message || err);
    return {
      success: false,
      error: err.message || 'Unknown network error',
    };
  }
}

/**
 * 1. Paid Welcome Email
 * Confirms Paystack payment & reserved seat, provides high-contrast action buttons,
 * and contains zero long dashes.
 */
async function sendPaidWelcomeEmail({ toEmail, toName, seatNumber, reference }) {
  const student = toName || 'Student';
  const seat = seatNumber || 'Cohort 01 Seat';
  const ref = reference || 'Verified Paystack Transaction';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Seat is Confirmed: The 1st Step Method</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0c0a09; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #1c1917; border: 1px solid #292524; border-radius: 14px; overflow: hidden; padding: 0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Accent Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); height: 5px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <span style="display: inline-block; background: rgba(16, 185, 129, 0.12); color: #10b981; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Payment Confirmed</span>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; line-height: 1.3; margin: 16px 0 8px 0;">Welcome to Cohort 01, ${student}</h1>
              <p style="color: #a8a29e; font-size: 15px; line-height: 1.6; margin: 0;">Your tuition payment via Paystack was successful. Your official seat in the live cohort has been locked and registered in the database.</p>
            </td>
          </tr>

          <!-- Reservation Details Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" style="background: #141210; border: 1px solid #292524; border-radius: 10px; padding: 20px;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Confirmed Spot</div>
                    <div style="font-size: 18px; font-weight: 800; color: #10b981; margin-top: 2px;">${seat}</div>
                  </td>
                  <td style="padding-bottom: 12px;" align="right">
                    <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Tuition Status</div>
                    <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px;">Paid: R499</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border-top: 1px solid #292524; padding-top: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Paystack Reference</div>
                    <div style="font-size: 12px; font-family: monospace; color: #d6d3d1; margin-top: 2px; word-break: break-all;">${ref}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What To Do Next -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <h2 style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">Next Steps to Access Your Training</h2>
              <p style="color: #a8a29e; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Please join the private Discord student community where Jay and Kutloano post cohort announcements, weekly live call schedules, and review student milestone assignments.</p>

              <!-- High Contrast Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <a href="${COMMUNITY_INVITE_URL}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; text-align: center; padding: 14px 20px; border-radius: 8px;">Join Student Discord Community</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${COURSE_PORTAL_URL}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #292524; color: #ffffff; border: 1px solid #44403c; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center; padding: 12px 20px; border-radius: 8px;">Access Course Roadmap Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Support & Footer -->
          <tr>
            <td style="background: #141210; border-top: 1px solid #292524; padding: 24px 32px;">
              <p style="color: #78716c; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                Have questions or need assistance? Reply directly to this email at <a href="mailto:${SENDER_EMAIL}" style="color: #10b981; text-decoration: none;">${SENDER_EMAIL}</a> and our team will get back to you promptly.
              </p>
              <p style="color: #57534e; font-size: 11px; margin: 0;">
                The 1st Step Method: 90-Day R5k Roadmap. Built for South African students.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendBrevoEmail({
    toEmail,
    toName: student,
    subject: `Seat Confirmed (${seat}): Welcome to The 1st Step Method`,
    htmlContent,
  });
}

/**
 * 2. Free Seat Confirmation Email
 * Confirms free seat reservation, links to free resources, explains upgrade option,
 * and contains zero long dashes.
 */
async function sendFreeSeatEmail({ toEmail, toName, seatNumber }) {
  const student = toName || 'Student';
  const seat = seatNumber || 'Free Student Seat';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free Seat is Reserved: The 1st Step Method</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0c0a09; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #1c1917; border: 1px solid #292524; border-radius: 14px; overflow: hidden; padding: 0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Accent Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%); height: 5px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <span style="display: inline-block; background: rgba(59, 130, 246, 0.12); color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Scholarship Reserved</span>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; line-height: 1.3; margin: 16px 0 8px 0;">Spot Confirmed, ${student}</h1>
              <p style="color: #a8a29e; font-size: 15px; line-height: 1.6; margin: 0;">You have successfully reserved your 100% tuition-free student seat for The 1st Step Method Cohort 01.</p>
            </td>
          </tr>

          <!-- Reservation Details Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" style="background: #141210; border: 1px solid #292524; border-radius: 10px; padding: 20px;" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Reserved Position</div>
                    <div style="font-size: 18px; font-weight: 800; color: #60a5fa; margin-top: 2px;">${seat}</div>
                  </td>
                  <td align="right">
                    <div style="font-size: 11px; font-weight: 700; color: #78716c; text-transform: uppercase; letter-spacing: 0.5px;">Tuition</div>
                    <div style="font-size: 14px; font-weight: 700; color: #10b981; margin-top: 2px;">FREE (R0)</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Starter Resources & Upgrade Path -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <h2 style="color: #ffffff; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">Access Your Starter Materials</h2>
              <p style="color: #a8a29e; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Get started today with the essential free resources, roadmap breakdown, and video creation guide. If you want direct 1-on-1 weekly mentorship calls, personalized video script reviews with Jay and Kutloano, and priority Discord review channels, you can upgrade to a full cohort seat at any time.
              </p>

              <!-- High Contrast Action Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <a href="${FREE_RESOURCES_URL}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; text-align: center; padding: 14px 20px; border-radius: 8px;">Access Free Starter Resources</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${COURSE_PORTAL_URL}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #292524; color: #ffffff; border: 1px solid #44403c; text-decoration: none; font-size: 14px; font-weight: 600; text-align: center; padding: 12px 20px; border-radius: 8px;">Upgrade to Full Mentorship Cohort</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Support & Footer -->
          <tr>
            <td style="background: #141210; border-top: 1px solid #292524; padding: 24px 32px;">
              <p style="color: #78716c; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                Have questions or need help? Reply directly to this email at <a href="mailto:${SENDER_EMAIL}" style="color: #10b981; text-decoration: none;">${SENDER_EMAIL}</a>.
              </p>
              <p style="color: #57534e; font-size: 11px; margin: 0;">
                The 1st Step Method: 90-Day R5k Roadmap. Built for South African students.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendBrevoEmail({
    toEmail,
    toName: student,
    subject: `Free Seat Confirmed (${seat}): The 1st Step Method`,
    htmlContent,
  });
}

/**
 * 3. Contact & Question Notification Email
 * Sends visitor inquiry to the verified sender email with replyTo set to the visitor,
 * and sends an automated confirmation reply back to the visitor. Zero long dashes.
 */
async function sendContactNotificationEmail({ fromName, fromEmail, message }) {
  const visitorName = fromName ? fromName.trim() : 'Website Visitor';
  const visitorEmail = fromEmail.trim();
  const visitorMessage = (message || '').trim();

  // Email 1: Notification sent to admin/mentor team
  const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Question from ${visitorName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0c0a09; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #1c1917; border: 1px solid #292524; border-radius: 12px; padding: 28px;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
              <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">New Inquiry</span>
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 12px 0 16px 0;">New Message from ${visitorName}</h2>
              <div style="background: #141210; border: 1px solid #292524; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <div style="color: #a8a29e; font-size: 13px; margin-bottom: 6px;"><strong>Sender Name:</strong> ${visitorName}</div>
                <div style="color: #a8a29e; font-size: 13px; margin-bottom: 12px;"><strong>Sender Email:</strong> <a href="mailto:${visitorEmail}" style="color: #10b981;">${visitorEmail}</a></div>
                <div style="color: #78716c; font-size: 11px; text-transform: uppercase; font-weight: 700;">Inquiry Content:</div>
                <div style="color: #f5f5f4; font-size: 14px; line-height: 1.6; margin-top: 6px; white-space: pre-wrap;">${visitorMessage}</div>
              </div>
              <p style="color: #78716c; font-size: 13px; margin: 0;">Hit "Reply" in your email client to reply directly to ${visitorEmail}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Email 2: Confirmation auto-reply to the visitor
  const autoReplyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>We Received Your Message: The 1st Step Method</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0c0a09; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #1c1917; border: 1px solid #292524; border-radius: 14px; overflow: hidden; padding: 0;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background: #10b981; height: 4px;"></td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">We Received Your Message, ${visitorName}</h2>
              <p style="color: #a8a29e; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                Thanks for reaching out to The 1st Step Method team. We have received your inquiry and Jay or Kutloano will respond directly to your email within 24 hours.
              </p>
              <div style="background: #141210; border: 1px solid #292524; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <div style="color: #78716c; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;">Your Inquiry:</div>
                <div style="color: #d6d3d1; font-size: 13px; line-height: 1.5; font-style: italic;">"${visitorMessage.slice(0, 300)}${visitorMessage.length > 300 ? '...' : ''}"</div>
              </div>
              <a href="${COURSE_PORTAL_URL}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 6px;">Visit Course Page</a>
            </td>
          </tr>
          <tr>
            <td style="background: #141210; border-top: 1px solid #292524; padding: 20px 32px;">
              <p style="color: #57534e; font-size: 12px; margin: 0;">
                The 1st Step Method: 90-Day R5k Roadmap. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Send admin notification
  const adminPromise = sendBrevoEmail({
    toEmail: SENDER_EMAIL,
    toName: 'The First Step Method Team',
    subject: `New Question from ${visitorName}: The 1st Step Method`,
    htmlContent: adminHtml,
    replyTo: visitorEmail,
  });

  // Send visitor auto-reply
  const autoReplyPromise = sendBrevoEmail({
    toEmail: visitorEmail,
    toName: visitorName,
    subject: 'We Received Your Message: The 1st Step Method',
    htmlContent: autoReplyHtml,
  });

  const [adminRes, visitorRes] = await Promise.allSettled([adminPromise, autoReplyPromise]);

  return {
    adminNotification: adminRes.status === 'fulfilled' ? adminRes.value : { success: false },
    visitorAutoReply: visitorRes.status === 'fulfilled' ? visitorRes.value : { success: false },
  };
}

module.exports = {
  sendBrevoEmail,
  sendPaidWelcomeEmail,
  sendFreeSeatEmail,
  sendContactNotificationEmail,
};
