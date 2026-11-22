function layout({ heading, body }) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#047857;">CureNeed Admin</p>
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;">${heading}</h1>
        ${body}
      </div>
    </div>
  `;
}

export function resetCodeEmail({ otp, expiresInMinutes }) {
  return {
    subject: 'Your CureNeed admin password reset code',
    text: [
      `Your CureNeed admin password reset code is ${otp}.`,
      `It expires in ${expiresInMinutes} minutes and can only be used once.`,
      'Never share this code with anyone. If you did not request it, you can ignore this email and your password will stay the same.',
    ].join('\n\n'),
    html: layout({
      heading: 'Reset your password',
      body: `
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569;">Enter this code on the admin login page to continue.</p>
        <p style="margin:0 0 20px;padding:16px;background:#ecfdf5;border-radius:12px;text-align:center;font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#065f46;">${otp}</p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;">It expires in ${expiresInMinutes} minutes and can only be used once. Never share this code with anyone.</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">If you didn't request this, you can ignore this email and your password will stay the same.</p>
      `,
    }),
  };
}

export function passwordChangedEmail({ changedAt }) {
  const when = changedAt.toUTCString();
  return {
    subject: 'Your CureNeed admin password was changed',
    text: [
      `Your CureNeed admin password was changed on ${when}. All existing sessions have been signed out.`,
      'If this was not you, contact your super admin immediately and reset your password again.',
    ].join('\n\n'),
    html: layout({
      heading: 'Your password was changed',
      body: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Your admin password was changed on <strong>${when}</strong>. All existing sessions have been signed out.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#b91c1c;">If this wasn't you, contact your super admin immediately and reset your password again.</p>
      `,
    }),
  };
}
