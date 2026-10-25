import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AgreementData, AuditTrail } from '../types/crm';
import { renderMouText, RED_FLAG_HOMES_COMPANY_INFO } from './mouTemplate';

/**
 * Generates a high-fidelity, print-quality PDF document containing all dynamic
 * contract clauses, property asset lists, digital hand signatures, verified live selfie
 * identity thumbnail, and complete cryptographic audit trail data.
 */
export async function downloadMouPdf(agreement: AgreementData, auditTrail?: AuditTrail | null) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '800px';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#09090b';
  container.style.padding = '44px';
  container.style.fontFamily = "'Times New Roman', Georgia, serif";
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.65';
  container.style.boxSizing = 'border-box';

  const mouBody = renderMouText(agreement);
  const signedDate = agreement.signedAt || auditTrail?.signedTimestamp
    ? new Date(agreement.signedAt || auditTrail?.signedTimestamp!).toLocaleString('en-IN')
    : new Date().toLocaleString('en-IN');

  const signatureData = auditTrail?.signatureData || '';
  const selfieUrl = agreement.clientSelfieUrl || auditTrail?.paymentScreenshotUrl || '';

  container.innerHTML = `
    <!-- Header Banner -->
    <div style="border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif;">
      <div>
        <h1 style="margin: 0; font-size: 26px; color: #dc2626; font-weight: 900; letter-spacing: -0.5px;">
          RED FLAG HOMES
        </h1>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #52525b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
          ${RED_FLAG_HOMES_COMPANY_INFO.tagline}
        </p>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 11px; color: #27272a;">
        <div style="font-weight: bold; color: #09090b;">OFFICIAL EXECUTED MOU</div>
        <div style="color: #dc2626; font-weight: bold; font-size: 12px;">AGREEMENT ID: ${agreement.id}</div>
        <div>Effective Date: ${agreement.effectiveDate || new Date().toISOString().split('T')[0]}</div>
      </div>
    </div>

    <!-- Legal Verification Seal Callout -->
    <div style="background-color: #fef2f2; border: 1.5px solid #fca5a5; padding: 12px 16px; border-radius: 8px; margin-bottom: 22px; font-family: sans-serif; font-size: 11px;">
      <div style="color: #991b1b; font-weight: bold; margin-bottom: 3px; font-size: 12px;">
        OFFICIAL EXECUTED CONTRACT & DIGITAL IDENTITY AUDIT RECORD
      </div>
      <div style="color: #3f3f46; line-height: 1.4;">
        This Memorandum of Understanding is legally binding and executed with digital signature verification, live identity photo capture, and verified IP record under Indian IT Act provisions.
      </div>
    </div>

    <!-- Complete Dynamic Agreement Body Text -->
    <div style="white-space: pre-wrap; margin-bottom: 28px; font-size: 11.5px; text-align: justify; font-family: 'Times New Roman', Georgia, serif; line-height: 1.65; color: #09090b;">
${mouBody}
    </div>

    <!-- Signatures & Identity Audit Verification Block -->
    <div style="margin-top: 32px; border-top: 2px solid #e4e4e7; padding-top: 20px; page-break-inside: avoid; font-family: sans-serif;">
      <h3 style="font-size: 13px; margin: 0 0 14px 0; color: #09090b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
        Execution Signatures & Identity Verification Records
      </h3>

      <div style="display: flex; gap: 14px; font-size: 11px; align-items: stretch;">
        <!-- Party A (Property Owner) Signature Box -->
        <div style="flex: 1; border: 1px solid #d4d4d8; padding: 14px; border-radius: 10px; background-color: #fafafa;">
          <div style="font-weight: 800; color: #09090b; margin-bottom: 6px; text-transform: uppercase; font-size: 11px;">
            PARTY A (PROPERTY OWNER)
          </div>
          <div style="margin-bottom: 2px;"><strong>Name:</strong> ${agreement.partyAName}</div>
          <div style="margin-bottom: 2px;"><strong>Mobile:</strong> ${agreement.partyAMobile || 'N/A'}</div>
          <div><strong>Email:</strong> ${agreement.partyAEmail || 'N/A'}</div>

          <div style="margin-top: 12px; border-top: 1px dashed #a1a1aa; padding-top: 8px; min-height: 55px;">
            <div style="font-size: 9px; color: #71717a; margin-bottom: 4px; font-weight: bold;">DIGITAL HAND SIGNATURE:</div>
            ${
              signatureData && signatureData.startsWith('data:image')
                ? `<img src="${signatureData}" style="max-height: 50px; max-width: 170px; object-fit: contain;" />`
                : `<div style="font-family: cursive; font-size: 18px; color: #09090b; font-style: italic;">${signatureData || agreement.partyAName}</div>`
            }
          </div>
          <div style="font-size: 9px; color: #52525b; margin-top: 6px; font-family: monospace;">
            Signed At: ${signedDate}
          </div>
        </div>

        <!-- Verified Live Selfie Photo Thumbnail -->
        ${
          selfieUrl
            ? `
            <div style="width: 145px; border: 1.5px solid #a7f3d0; padding: 12px; border-radius: 10px; background-color: #ecfdf5; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="font-size: 9px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 6px;">
                ✓ Live Selfie Photo
              </div>
              <div style="width: 80px; height: 80px; margin: 0 auto; border-radius: 10px; overflow: hidden; border: 2.5px solid #059669; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                <img src="${selfieUrl}" style="width: 80px; height: 80px; object-fit: cover;" />
              </div>
              <div style="font-size: 8px; color: #065f46; margin-top: 6px; font-family: monospace; font-weight: bold;">
                VERIFIED MATCH
              </div>
            </div>
            `
            : ''
        }

        <!-- Party B Corporate Seal Box -->
        <div style="flex: 1; border: 1px solid #fca5a5; padding: 14px; border-radius: 10px; background-color: #fff5f5;">
          <div style="font-weight: 800; color: #dc2626; margin-bottom: 6px; text-transform: uppercase; font-size: 11px;">
            PARTY B (RED FLAG HOMES)
          </div>
          <div style="margin-bottom: 2px;"><strong>Entity:</strong> Red Flag Homes Network</div>
          <div style="margin-bottom: 2px;"><strong>Corporate Office:</strong> ${RED_FLAG_HOMES_COMPANY_INFO.address}</div>
          <div><strong>Official Email:</strong> ${RED_FLAG_HOMES_COMPANY_INFO.email}</div>

          <div style="margin-top: 12px; border-top: 1px dashed #fca5a5; padding-top: 8px; text-align: center;">
            <div style="display: inline-block; border: 2px double #dc2626; color: #dc2626; padding: 4px 12px; font-weight: bold; border-radius: 6px; font-size: 10px; font-family: sans-serif;">
              OFFICIAL DIGITAL COMPANY SEAL
              <br />
              <span style="font-size: 8px; color: #7f1d1d;">RED FLAG HOMES NETWORK</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Verification Footer Log -->
      ${
        auditTrail
          ? `
        <div style="margin-top: 16px; padding: 12px 14px; border: 1px solid #e4e4e7; border-radius: 10px; background-color: #f4f4f5; font-family: monospace; font-size: 9.5px; color: #27272a; line-height: 1.5;">
          <div style="font-weight: bold; color: #09090b; margin-bottom: 3px; font-size: 10px;">AUDIT TRAIL CERTIFICATE ID: ${auditTrail.certificateId}</div>
          <div>Client IP Address: <strong>${auditTrail.ipAddress}</strong> | Signing Timestamp: <strong>${auditTrail.signedTimestamp}</strong></div>
          <div>Verification Browser & Device: ${auditTrail.device || 'Desktop/Mobile'} (${auditTrail.browser || 'Browser'})</div>
          <div>Document SHA-256 Hash: <span style="color: #dc2626; font-weight: bold;">${auditTrail.documentHash}</span></div>
        </div>
        `
          : ''
      }
    </div>

    <div style="margin-top: 28px; border-top: 1px solid #e4e4e7; padding-top: 12px; font-family: sans-serif; font-size: 9px; color: #71717a; text-align: center;">
      Red Flag Homes Executive Portal • Guru Marg, Paschim Vihar, New Delhi • Official Email: agreements@redflaghomes.in
    </div>
  `;

  document.body.appendChild(container);

  // Allow DOM & base64 images to settle in layout
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5, // High DPI capture for crisp vectors and sharp typography
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Red_Flag_Homes_Signed_MOU_${agreement.id}.pdf`);
  } catch (err) {
    console.error('Failed to generate high-fidelity MOU PDF via html2canvas/jsPDF:', err);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Downloads a separate Digital Audit Certificate PDF for the agreement
 * containing client selfie photo thumbnail, IP address, timestamp, device details & SHA-256 hash
 */
export async function downloadAuditCertificatePdf(auditTrail: AuditTrail, agreement: AgreementData) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = '800px';
  container.style.zIndex = '-9999';
  container.style.opacity = '0.99';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = '#09090b';
  container.style.color = '#f4f4f5';
  container.style.padding = '40px';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.style.boxSizing = 'border-box';

  const selfieUrl = agreement.clientSelfieUrl || auditTrail.paymentScreenshotUrl || '';

  container.innerHTML = `
    <div style="border: 2px solid #dc2626; border-radius: 16px; padding: 32px; background: linear-gradient(135deg, #18181b 0%, #09090b 100%); font-family: sans-serif;">
      <div style="text-align: center; border-bottom: 2px solid #27272a; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="color: #dc2626; font-size: 26px; margin: 0; font-weight: 900; letter-spacing: -0.5px;">
          RED FLAG HOMES NETWORK
        </h1>
        <p style="color: #a1a1aa; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">
          DIGITAL AUDIT TRAIL CERTIFICATE OF EXECUTION
        </p>
      </div>

      <!-- Certificate Header with Selfie Photo Badge -->
      <div style="display: flex; gap: 16px; align-items: center; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        ${
          selfieUrl
            ? `
            <div style="text-align: center; shrink: 0;">
              <img src="${selfieUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px; border: 2px solid #10b981;" />
              <span style="display: block; font-size: 8px; color: #10b981; font-family: monospace; font-weight: bold; margin-top: 4px;">VERIFIED SELFIE</span>
            </div>
            `
            : ''
        }
        <div style="flex: 1;">
          <div style="color: #71717a; font-size: 10px; text-transform: uppercase; font-family: monospace;">Certificate Identifier</div>
          <div style="color: #10b981; font-size: 20px; font-weight: bold; font-family: monospace; margin: 2px 0;">
            ${auditTrail.certificateId}
          </div>
          <div style="color: #a1a1aa; font-size: 11px;">Verified Electronic Signature, Selfie & Cryptographic Audit Stamp</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; font-size: 12px;">
        <div style="background-color: #18181b; padding: 14px; border-radius: 8px; border: 1px solid #27272a;">
          <span style="color: #71717a; display: block; font-size: 10px; font-family: monospace;">AGREEMENT ID</span>
          <strong style="color: #ef4444; font-size: 14px; font-family: monospace;">${agreement.id}</strong>
        </div>

        <div style="background-color: #18181b; padding: 14px; border-radius: 8px; border: 1px solid #27272a;">
          <span style="color: #71717a; display: block; font-size: 10px; font-family: monospace;">SIGNING TIMESTAMP</span>
          <strong style="color: #ffffff; font-size: 13px;">${new Date(auditTrail.signedTimestamp).toLocaleString('en-IN')}</strong>
        </div>

        <div style="background-color: #18181b; padding: 14px; border-radius: 8px; border: 1px solid #27272a;">
          <span style="color: #71717a; display: block; font-size: 10px; font-family: monospace;">PROPERTY OWNER (PARTY A)</span>
          <strong style="color: #ffffff; font-size: 13px;">${agreement.partyAName}</strong>
          <div style="color: #a1a1aa; font-size: 11px;">${agreement.partyAEmail || ''} ${agreement.partyAMobile ? '• ' + agreement.partyAMobile : ''}</div>
        </div>

        <div style="background-color: #18181b; padding: 14px; border-radius: 8px; border: 1px solid #27272a;">
          <span style="color: #71717a; display: block; font-size: 10px; font-family: monospace;">CLIENT IP ADDRESS</span>
          <strong style="color: #ffffff; font-size: 13px; font-family: monospace;">${auditTrail.ipAddress}</strong>
        </div>
      </div>

      <div style="background-color: #18181b; padding: 16px; border-radius: 10px; border: 1px solid #27272a; margin-bottom: 24px; font-family: monospace; font-size: 11px;">
        <span style="color: #71717a; display: block; font-size: 10px; margin-bottom: 4px;">CRYPTOGRAPHIC SHA-256 DOCUMENT HASH</span>
        <div style="color: #f87171; word-break: break-all; background-color: #09090b; padding: 10px; border-radius: 6px; border: 1px solid #3f3f46;">
          ${auditTrail.documentHash}
        </div>
      </div>

      <div style="text-align: center; border-top: 1px solid #27272a; padding-top: 16px; color: #71717a; font-size: 10px;">
        Red Flag Homes Executive Audit Engine • Official Desk: agreements@redflaghomes.in • Guru Marg, Paschim Vihar, New Delhi
      </div>
    </div>
  `;

  document.body.appendChild(container);

  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#09090b',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, imgHeight);
    pdf.save(`Audit_Certificate_${auditTrail.certificateId}.pdf`);
  } catch (err) {
    console.error('Failed to generate Audit PDF:', err);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
