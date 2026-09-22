const sendMail = require('./sendMail');
const { renderEmail } = require('./emailTemplate');

/**
 * Generate Vaultix-styled modern HTML email template for employee invitations
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
}) {
  const extraHtml = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:12px;background-color:#f8fafc;overflow:hidden">
      <tr>
        <td style="padding:18px 20px">
          <p style="margin:0 0 12px;font-family:'Segoe UI',Arial,sans-serif;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px">
            ACCOUNT CREDENTIALS
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="5">
            ${employeeId ? `
            <tr>
              <td width="38%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748b">Employee ID:</td>
              <td width="62%" style="font-family:monospace;font-size:14px;font-weight:700;color:#0f172a">${employeeId}</td>
            </tr>` : ''}
            <tr>
              <td width="38%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748b">Role:</td>
              <td width="62%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a">${role}</td>
            </tr>
            <tr>
              <td width="38%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748b">Department:</td>
              <td width="62%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a">${department}</td>
            </tr>
            ${designation ? `
            <tr>
              <td width="38%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748b">Designation:</td>
              <td width="62%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a">${designation}</td>
            </tr>` : ''}
            ${tempPassword ? `
            <tr>
              <td width="38%" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#64748b">Temporary Password:</td>
              <td width="62%" style="font-family:monospace;font-size:14px;font-weight:700;color:#1e293b;background-color:#e2e8f0;padding:4px 8px;border-radius:4px;display:inline-block">${tempPassword}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>

    ${customMessage ? `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;border-left:4px solid #14286D;background-color:#eef2ff;border-radius:6px">
      <tr>
        <td style="padding:12px 16px">
          <p style="margin:0;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-style:italic;color:#1e3a8a">"${customMessage}"</p>
        </td>
      </tr>
    </table>
    ` : ''}
  `;

  return renderEmail({
    title: isExistingUser
      ? `Welcome Back, ${recipientName}!`
      : `You're Invited to Join ${companyName}!`,
    body: isExistingUser
      ? `Here are your updated account details and quick sign-in access to the <strong>${companyName}</strong> Employee Management System.`
      : `You have been registered by the administration on the <strong>${companyName}</strong> Employee Portal. Access your workgroups, schedule, and company resources below.`,
    buttonText: 'Sign In to Workspace',
    buttonUrl: portalUrl,
    accent: 'blue',
    extraHtml,
    footerNote: tempPassword
      ? 'Please sign in using your temporary password and update it in your Profile settings.'
      : 'You can sign in using your registered credentials.',
  });
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

  const subject = isExistingUser
    ? `Access Your ${companyName} Employee Account`
    : `Invitation: Join ${companyName} on the Employee Portal`;

  try {
    const info = await sendMail({
      to: recipientEmail,
      subject,
      html,
      replyTo: 'avinashs@knadvisors.pro',
    });
    return { success: true, messageId: info?.messageId, email: recipientEmail };
  } catch (error) {
    console.error(`[Mailer] Error sending to ${recipientEmail}:`, error.message);
    return {
      success: false,
      email: recipientEmail,
      error: error.message,
      fallbackCredentials: {
        employeeId,
        tempPassword,
        portalUrl,
      },
    };
  }
}

module.exports = {
  sendMail,
  renderEmail,
  buildInvitationHtml,
  sendInvitationEmail,
};
