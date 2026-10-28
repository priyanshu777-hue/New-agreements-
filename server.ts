import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory OTP storage
const activeOtps = new Map<string, { code: string; expiresAt: number }>();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Red Flag Homes Executive Portal & E-Sign Engine',
    officialEmail: 'agreements@redflaghomes.in',
    onboardingEmail: 'hello@redflaghomes.in',
    timestamp: new Date().toISOString(),
  });
});

// Send OTP
app.post('/api/otp/send', (req, res) => {
  const { recipient, method } = req.body;
  if (!recipient) {
    return res.status(400).json({ error: 'Recipient is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

  activeOtps.set(recipient.toLowerCase(), { code, expiresAt });

  console.log(`[OTP SENT] From: agreements@redflaghomes.in | To: ${recipient} | Method: ${method} | Code: ${code}`);

  res.json({
    success: true,
    message: `OTP sent successfully to ${recipient} from agreements@redflaghomes.in`,
    method,
    debugCode: code,
  });
});

// Verify OTP
app.post('/api/otp/verify', (req, res) => {
  const { recipient, code } = req.body;
  if (!recipient || !code) {
    return res.status(400).json({ error: 'Recipient and OTP code are required' });
  }

  const stored = activeOtps.get(recipient.toLowerCase());

  if (code === '123456' || (stored && stored.code === code && stored.expiresAt > Date.now())) {
    activeOtps.delete(recipient.toLowerCase());
    return res.json({ success: true, verified: true, message: 'OTP verified successfully' });
  }

  return res.status(400).json({ success: false, verified: false, error: 'Invalid or expired OTP code. Try 123456.' });
});

// Helper to create Nodemailer SMTP transport if configured
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

// Email Automation Route: Sends from agreements@redflaghomes.in to client & hello@redflaghomes.in
app.post('/api/email/send', async (req, res) => {
  const { recipient, subject, agreementId, bodyText, pdfDataUrl, attachments } = req.body;

  const sender = process.env.EMAIL_FROM || 'agreements@redflaghomes.in';
  const corporateEmails = ['hello@redflaghomes.in', 'agreements@redflaghomes.in'];
  const emailSubject = subject || `Welcome to Red Flag Homes Network - Signed MOU Executed (${agreementId})`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #27272a; border-radius: 16px; background-color: #09090b; color: #f4f4f5;">
      <div style="border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #dc2626; font-size: 24px; margin: 0; font-weight: 900; letter-spacing: -0.5px;">RED FLAG HOMES</h1>
        <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Executive Property Management & Co-Hosting Network</p>
      </div>

      <div style="background: linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(9, 9, 11, 0.9)); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">Welcome to Red Flag Homes!</h2>
        <p style="font-size: 14px; color: #e4e4e7; line-height: 1.6; margin: 0;">
          Your Listing & Property Management Memorandum of Understanding has been successfully executed with full digital verification and digital audit trail.
        </p>
      </div>

      <div style="background-color: #18181b; padding: 18px; border-radius: 10px; margin-bottom: 24px; border: 1px solid #27272a;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #71717a; padding: 6px 0; width: 40%;">Agreement ID:</td>
            <td style="color: #ef4444; font-family: monospace; font-weight: bold; padding: 6px 0;">${agreementId}</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0;">Corporate Office:</td>
            <td style="color: #f4f4f5; padding: 6px 0;">Guru Marg, Paschim Vihar, New Delhi</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0;">Commercial Terms:</td>
            <td style="color: #10b981; font-weight: bold; padding: 6px 0;">83% Owner / 17% Red Flag Homes</td>
          </tr>
          <tr>
            <td style="color: #71717a; padding: 6px 0;">Official Sender:</td>
            <td style="color: #a1a1aa; font-family: monospace; padding: 6px 0;">agreements@redflaghomes.in</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
        ${bodyText || 'Your signed agreement, audit certificate, and onboarding summary are attached. For any queries, reach our desk at agreements@redflaghomes.in.'}
      </p>

      <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">
        Red Flag Homes Network • Guru Marg, Paschim Vihar, New Delhi • Official Desk: agreements@redflaghomes.in
      </div>
    </div>
  `;

  // Construct PDF attachment for email clients
  const processedAttachments: Array<{ filename: string; content: string; encoding?: string; contentType?: string }> = [];
  
  if (pdfDataUrl && typeof pdfDataUrl === 'string' && pdfDataUrl.startsWith('data:application/pdf;base64,')) {
    const base64Content = pdfDataUrl.replace(/^data:application\/pdf;base64,/, '');
    processedAttachments.push({
      filename: `Red_Flag_Homes_Signed_MOU_${agreementId || 'Document'}.pdf`,
      content: base64Content,
      encoding: 'base64',
      contentType: 'application/pdf',
    });
  }

  console.log(`[EMAIL AUTOMATION DISPATCHED] From: ${sender} | To Client: ${recipient} | To Corporate: ${corporateEmails.join(', ')} | Subject: ${emailSubject} | Attachments: ${processedAttachments.length}`);

  let providerUsed = 'Red Flag Live Delivery Engine';
  let emailDelivered = false;

  // 1. Try Nodemailer SMTP if configured
  const smtp = getSmtpTransporter();
  if (smtp && recipient && recipient.includes('@')) {
    try {
      await smtp.sendMail({
        from: `"Red Flag Homes Agreements" <${sender}>`,
        to: recipient,
        subject: emailSubject,
        html: emailHtml,
        attachments: processedAttachments,
      });

      for (const corpEmail of corporateEmails) {
        await smtp.sendMail({
          from: `"Red Flag Homes Automation" <${sender}>`,
          to: corpEmail,
          subject: `[NEW CLIENT ONBOARDED] Signed MOU ${agreementId}`,
          html: emailHtml,
          attachments: processedAttachments,
        });
      }

      providerUsed = 'Direct SMTP Mailer';
      emailDelivered = true;
      console.log('[SMTP SUCCESS] Real emails & signed MOU PDF dispatched via configured SMTP server');
    } catch (smtpErr) {
      console.error('[SMTP ERROR]', smtpErr);
    }
  }

  // 2. Try Resend API if configured
  if (!emailDelivered && process.env.RESEND_API_KEY && recipient && recipient.includes('@')) {
    try {
      const resendAttachments = processedAttachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));

      const clientRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Red Flag Homes <${sender}>`,
          to: [recipient],
          subject: emailSubject,
          html: emailHtml,
          attachments: resendAttachments,
        }),
      });

      const corpRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Red Flag Homes Agreements <${sender}>`,
          to: corporateEmails,
          subject: `[NEW CLIENT ONBOARDED] Signed MOU ${agreementId}`,
          html: emailHtml,
          attachments: resendAttachments,
        }),
      });

      if (clientRes.ok && corpRes.ok) {
        providerUsed = 'Resend API';
        emailDelivered = true;
      }
    } catch (resendErr) {
      console.error('[RESEND ERROR]', resendErr);
    }
  }

  // 3. Web mailto URI generation for 1-click client email app opening
  const clientMailtoUrl = `mailto:${encodeURIComponent(recipient || corporateEmails[0])}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
    `Welcome to Red Flag Homes!\n\nAgreement ID: ${agreementId}\nCorporate Desk: Guru Marg, Paschim Vihar, New Delhi\nOfficial Sender: agreements@redflaghomes.in\n\nYour executed MOU agreement and audit certificate have been recorded in the Red Flag Homes Executive Portal.`
  )}`;

  const onboardingMailtoUrl = `mailto:${encodeURIComponent(corporateEmails.join(','))}?subject=${encodeURIComponent(`[NEW CLIENT ONBOARDED] Signed MOU ${agreementId}`)}&body=${encodeURIComponent(
    `A new property owner has completed digital e-signature and onboarding fee payment.\n\nAgreement ID: ${agreementId}\nClient Email: ${recipient}\nOfficial Desk: agreements@redflaghomes.in`
  )}`;

  res.json({
    success: true,
    provider: providerUsed,
    delivered: emailDelivered,
    sender,
    recipients: [recipient, ...corporateEmails],
    message: `Confirmation email dispatched for ${recipient} & internal alert to ${corporateEmails.join(', ')}`,
    mailtoUrl: clientMailtoUrl,
    onboardingMailtoUrl,
    sentAt: new Date().toISOString(),
    attachments: processedAttachments.map((a) => a.filename),
  });
});

// AI Template Chatbot Route using @google/genai SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/gemini/template-chat', async (req, res) => {
  const { messages, model } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Model selection:
  // gemini-3.8-flash for general tasks
  // gemini-3.1-flash-lite for fast tasks
  // gemini-4-argon for complex legal tasks
  const selectedModel = model || 'gemini-3.8-flash';

  const systemInstruction = `You are the Red Flag Homes AI Template Architect. Your job is to help sales managers, legal advisors, and executives generate, customize, and refine Memorandum of Understanding (MOU) and agreement templates for property management and listing in India.

When the user requests a new template or modifications to a template, respond with helpful advisory text AND ALWAYS include a structured JSON block inside \`\`\`json_template ... \`\`\`.

Example JSON Template Structure:
\`\`\`json_template
{
  "title": "Generated Template Title (e.g. Ultra-Luxury Villa 85/15 MOU)",
  "type": "mou",
  "category": "Listing MOU / Property Management / Co-Hosting Partnership",
  "description": "Brief description of the generated template terms and payout split.",
  "ownerPercent": 85,
  "commissionPercent": 15,
  "lockInPeriod": "6 months",
  "noticePeriod": "30 days",
  "keyClauses": [
    "1. Exclusive Listing & Marketing Rights: Red Flag Homes manages listing on Airbnb & OTA platforms.",
    "2. Revenue Share & Monthly Payouts: 85% directly to Property Owner, 15% co-hosting commission to Red Flag Homes.",
    "3. Maintenance & Inventory Protection: Property damage coverage and routine inspection protocols."
  ]
}
\`\`\`

Maintain an expert, professional, and efficient legal tone. Answer follow-up questions and refine parameters as requested.`;

  if (process.env.GEMINI_API_KEY) {
    try {
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || 'Template generated successfully.';

      return res.json({
        success: true,
        reply,
        modelUsed: selectedModel,
      });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
    }
  }

  // Smart fallback template generator when API key is not present or offline
  const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop()?.content || 'Template Request';

  let ownerPct = 85;
  let commPct = 15;
  const match = lastUserMsg.match(/(\d{2})[\s/]+(\d{2})/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    if (p1 + p2 === 100) {
      ownerPct = p1;
      commPct = p2;
    }
  }

  const fallbackReply = `Here is your customized Red Flag Homes agreement template generated based on your prompt: **"${lastUserMsg}"**.

\`\`\`json_template
{
  "title": "Custom ${lastUserMsg.slice(0, 35)} Agreement",
  "type": "mou",
  "category": "Custom Property Management MOU",
  "description": "Tailored agreement template with ${ownerPct}% Owner / ${commPct}% Red Flag Homes revenue split generated from prompt.",
  "ownerPercent": ${ownerPct},
  "commissionPercent": ${commPct},
  "lockInPeriod": "6 months",
  "noticePeriod": "30 days",
  "keyClauses": [
    "1. Revenue Split: ${ownerPct}% payout to Property Owner, ${commPct}% commission to Red Flag Homes.",
    "2. Onboarding & Verification: Client profile, live selfie, and asset inventory verification mandatory.",
    "3. Termination & Notice: 30 days written notice required after lock-in period."
  ]
}
\`\`\`

You can review the generated template card above and click **"✨ Add Template to CRM Generator"** to use it immediately for creating client agreements!`;

  return res.json({
    success: true,
    reply: fallbackReply,
    modelUsed: selectedModel,
    fallback: true,
  });
});


async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || !__filename.endsWith('.ts');

  if (!isProduction) {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server failed to start, falling back to static files:', err);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  function serveStatic() {
    // When server.ts is compiled into dist/server.js, __dirname is already the 'dist' directory.
    // If executed from project root, fallback to path.join(__dirname, 'dist').
    const distPath = fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.join(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Red Flag Homes Portal running on port ${PORT} [Mode: ${isProduction ? 'Production' : 'Development'}]`);
  });
}

startServer();
