// lib/email.ts
// Transactional email helpers for Qasberry — powered by Resend.
// Each function composes a branded HTML email and sends it.
//
// Env var: RESEND_API_KEY
// Docs: https://resend.com/docs
//
// Emails sent:
//   1. Enrollment confirmation (when a student enrolls in a course)
//   2. Certificate issued (when a student completes a course)
//   3. Welcome email (on first sign-up — called from the Clerk webhook)

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS   = 'Qasberry <no-reply@qasberry.com>'
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qasberry.com'

// ── Generic send helper ────────────────────────────────────────────────────────

interface SendEmailOptions {
  to:      string
  subject: string
  html:    string
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || apiKey.includes('REPLACE_ME')) {
    // Not configured — log and skip in development
    console.log(`[email] RESEND_API_KEY not set. Would send "${subject}" to ${to}`)
    return
  }

  const res = await fetch(RESEND_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }
}

// ── Shared HTML shell ──────────────────────────────────────────────────────────

function emailShell(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0f0f1a;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#06b6d4);border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-size:16px;font-weight:bold;">⚡</span>
                </td>
                <td style="padding-left:10px;color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Qasberry</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;">
            <p style="margin:0;color:#4a5568;font-size:12px;">
              © ${new Date().getFullYear()} Qasberry AI Academy ·
              <a href="${APP_URL}" style="color:#7c3aed;text-decoration:none;">qasberry.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}

// ── 1. Enrollment confirmation ─────────────────────────────────────────────────

interface EnrollmentEmailOptions {
  to:          string
  studentName: string
  courseTitle: string
  courseId?:   string
}

export async function sendEnrollmentEmail({
  to, studentName, courseTitle, courseId,
}: EnrollmentEmailOptions): Promise<void> {
  const learnUrl = courseId ? `${APP_URL}/learn/${courseId}` : `${APP_URL}/dashboard`

  const content = `
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700;">You're enrolled! 🎉</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Hi ${studentName}, you now have full access to <strong style="color:#fff;">${courseTitle}</strong>.
      Start watching your first lesson whenever you're ready.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
          <a href="${learnUrl}" style="color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
            Start learning →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#4a5568;font-size:13px;">
      If you didn't enrol in this course, you can safely ignore this email.
    </p>
  `

  await sendEmail({
    to,
    subject: `You're enrolled in ${courseTitle} 🚀`,
    html:    emailShell(content),
  })
}

// ── 2. Certificate issued ──────────────────────────────────────────────────────

interface CertificateEmailOptions {
  to:            string
  studentName:   string
  courseTitle:   string
  certificateId: string
}

export async function sendCertificateEmail({
  to, studentName, courseTitle, certificateId,
}: CertificateEmailOptions): Promise<void> {
  const certUrl = `${APP_URL}/certificates/${certificateId}`

  const content = `
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700;">Congratulations! 🏆</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Hi ${studentName}, you've successfully completed <strong style="color:#fff;">${courseTitle}</strong>.
      Your verified certificate is ready to share on LinkedIn and beyond.
    </p>

    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08));border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:24px;margin-bottom:32px;text-align:center;">
      <p style="margin:0 0 4px;color:#a78bfa;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Certificate of Completion</p>
      <p style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:700;">${courseTitle}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">Awarded to ${studentName}</p>
    </div>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
          <a href="${certUrl}" style="color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
            View & share certificate →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#4a5568;font-size:13px;">
      Keep up the great work — explore more courses to continue your AI journey.
    </p>
  `

  await sendEmail({
    to,
    subject: `Your certificate for ${courseTitle} is ready! 🏆`,
    html:    emailShell(content),
  })
}

// ── 3. Welcome email ───────────────────────────────────────────────────────────

interface WelcomeEmailOptions {
  to:        string
  firstName: string
}

export async function sendWelcomeEmail({ to, firstName }: WelcomeEmailOptions): Promise<void> {
  const content = `
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:700;">Welcome to Qasberry! ⚡</h1>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Hi ${firstName}, we're thrilled to have you. Qasberry is an AI learning academy built 
      specifically for professionals like you — career-first, practical, and beautifully designed.
    </p>

    <p style="margin:0 0 16px;color:#94a3b8;font-size:15px;line-height:1.6;">
      Your next step: <strong style="color:#fff;">tell us your career</strong> so our AI 
      can build a personalised learning roadmap just for you.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
      <tr>
        <td style="background:#7c3aed;border-radius:10px;padding:14px 28px;">
          <a href="${APP_URL}/onboarding" style="color:#fff;font-weight:600;font-size:15px;text-decoration:none;">
            Build my AI roadmap →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#4a5568;font-size:13px;">
      Questions? Just reply to this email — we're here to help.
    </p>
  `

  await sendEmail({
    to,
    subject: 'Welcome to Qasberry — your AI journey starts here ⚡',
    html:    emailShell(content),
  })
}
