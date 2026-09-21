const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn("[Mailer] EMAIL_USER or EMAIL_PASS not configured in environment.");
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

/**
 * Generate modern HTML email template for employee invitation
 */
function buildInvitationHtml({
  recipientName = "Team Member",
  companyName = "KN Advisors",
  role = "Employee",
  department = "KN Advisors",
  designation = "Associate",
  employeeId = "",
  tempPassword = "",
  portalUrl = "http://localhost:3000",
  customMessage = "",
  isExistingUser = false,
  inviterName = "The Management Team",
}) {
  const brandColor = "#14286D";
  const accentColor = "#4F46E5";
  const lightBg = "#F4F6FB";
  const borderCol = "#E2E8F0";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid ${borderCol};" cellspacing="0" cellpadding="0">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandColor} 0%, #1E3A8A 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background-color: #FFFFFF; color: ${brandColor}; width: 52px; height: 52px; line-height: 52px; border-radius: 12px; font-weight: 800; font-size: 22px; text-align: center; margin: 0 auto 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                      KN
                    </div>
                    <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">${companyName}</h1>
                    <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin: 6px 0 0;">Employee Management & Workspace Portal</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 16px;">
                Hello, ${recipientName}! 👋
              </h2>
              
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                ${isExistingUser
                  ? `You are receiving this email with your updated account details and quick login access to the <strong>${companyName}</strong> Employee Management System.`
                  : `You've been invited by <strong>${inviterName}</strong> to join the team on the <strong>${companyName}</strong> Employee Management System.`
                }
              </p>

              ${customMessage ? `
              <div style="background-color: #EEF2FF; border-left: 4px solid ${accentColor}; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="font-size: 14px; line-height: 1.5; color: #3730A3; margin: 0; font-style: italic;">
                  "${customMessage}"
                </p>
              </div>
              ` : ''}

              <!-- Credentials Card -->
              <div style="background-color: ${lightBg}; border: 1px solid ${borderCol}; border-radius: 10px; padding: 22px; margin-bottom: 28px;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748B; margin: 0 0 16px; font-weight: 700;">
                  Your Account Details
                </h3>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                  ${employeeId ? `
                  <tr>
                    <td width="38%" style="font-size: 14px; color: #64748B; font-weight: 500;">Employee ID:</td>
                    <td width="62%" style="font-size: 14px; color: #0F172A; font-weight: 700; font-family: monospace;">${employeeId}</td>
                  </tr>` : ''}
                  <tr>
                    <td width="38%" style="font-size: 14px; color: #64748B; font-weight: 500;">Role:</td>
                    <td width="62%" style="font-size: 14px; color: #0F172A; font-weight: 600;">${role}</td>
                  </tr>
                  <tr>
                    <td width="38%" style="font-size: 14px; color: #64748B; font-weight: 500;">Department:</td>
                    <td width="62%" style="font-size: 14px; color: #0F172A; font-weight: 600;">${department}</td>
                  </tr>
                  ${designation ? `
                  <tr>
                    <td width="38%" style="font-size: 14px; color: #64748B; font-weight: 500;">Designation:</td>
                    <td width="62%" style="font-size: 14px; color: #0F172A; font-weight: 600;">${designation}</td>
                  </tr>` : ''}
                  ${tempPassword ? `
                  <tr>
                    <td width="38%" style="font-size: 14px; color: #64748B; font-weight: 500;">Temporary Password:</td>
                    <td width="62%" style="font-size: 14px; color: #1E293B; font-weight: 700; font-family: monospace; background-color: #E2E8F0; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                      ${tempPassword}
                    </td>
                  </tr>` : ''}
                </table>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="background: linear-gradient(135deg, ${brandColor} 0%, ${accentColor} 100%); color: #FFFFFF; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(20, 40, 109, 0.25);">
                      Sign In to Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              ${tempPassword ? `
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                <p style="font-size: 13px; color: #92400E; margin: 0; line-height: 1.5;">
                  <strong>Important Security Notice:</strong> Please sign in using your temporary password and update it immediately in your Profile settings.
                </p>
              </div>
              ` : ''}

              <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin: 0;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${portalUrl}" style="color: ${accentColor}; word-break: break-all;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 40px; border-top: 1px solid ${borderCol}; text-align: center;">
              <p style="font-size: 13px; color: #64748B; margin: 0 0 6px;">
                &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
              </p>
              <p style="font-size: 12px; color: #94A3B8; margin: 0;">
                This invitation was sent to you because an administrator registered or updated your account in the Employee Management System.
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
}

/**
 * Send invitation email to a single recipient
 */
async function sendInvitationEmail({
  recipientEmail,
  recipientName,
  companyName = "KN Advisors",
  role = "Employee",
  department = "KN Advisors",
  designation = "Associate",
  employeeId = "",
  tempPassword = "",
  portalUrl = "http://localhost:3000",
  customMessage = "",
  isExistingUser = false,
  inviterName = "Management",
}) {
  if (!recipientEmail) {
    throw new Error("Recipient email is required");
  }

  const mailer = getTransporter();
  const senderEmail = process.env.EMAIL_USER || "no-reply@knadvisors.com";
  const senderName = companyName || "KN Advisors";

  const html = buildInvitationHtml({
    recipientName,
    companyName,
    role,
    department,
    designation,
    employeeId,
    tempPassword,
    portalUrl,
    customMessage,
    isExistingUser,
    inviterName,
  });

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: recipientEmail,
    subject: isExistingUser
      ? `Access Your ${companyName} Employee Account`
      : `Invitation: Join ${companyName} on the Employee Portal`,
    html,
    text: `Hello ${recipientName},\n\nYou have been invited to ${companyName}.\nRole: ${role}\nDepartment: ${department}\nEmployee ID: ${employeeId}\nTemporary Password: ${tempPassword || 'Existing'}\nLogin at: ${portalUrl}`,
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, email: recipientEmail };
  } catch (error) {
    console.error(`[Mailer] Error sending to ${recipientEmail}:`, error.message);
    return {
      success: false,
      email: recipientEmail,
      error: error.message,
      // Provide fallback details so admin can still share credentials directly
      fallbackCredentials: {
        employeeId,
        tempPassword,
        portalUrl,
      },
    };
  }
}

module.exports = {
  getTransporter,
  buildInvitationHtml,
  sendInvitationEmail,
};
