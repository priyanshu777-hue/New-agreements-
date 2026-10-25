import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AgreementData, AuditTrail } from '../types/crm';
import { renderMouText, RED_FLAG_HOMES_COMPANY_INFO } from './mouTemplate';

/**
 * Creates a clean, printable HTML element styled as a formal contract document
 * and exports it to a high-quality PDF using html2canvas & jsPDF.
 */
export async function downloadMouPdf(agreement: AgreementData, auditTrail?: AuditTrail | null) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#09090b';
  container.style.padding = '40px';
  container.style.fontFamily = "'Times New Roman', Georgia, serif";
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.6';
  container.style.boxSizing = 'border-box';

  const mouBody = renderMouText(agreement);
  const signedDate = agreement.signedAt
    ? new Date(agreement.signedAt).toLocaleString('en-IN')
    : new Date().toLocaleString('en-IN');

  const assetListHtml = agreement.assets && agreement.assets.length > 0
    ? agreement.assets.map((a, i) => `<div style="margin-left: 10px;">• <strong>Asset #${i + 1}:</strong> ${a.propertyAddress} (${a.bhkCount || 'N/A'})</div>`).join('')
    : `<div style="margin-left: 10px;">• <strong>Property:</strong> ${agreement.propertyAddress || 'N/A'}</div>`;

  const signatureData = auditTrail?.signatureData || agreement.clientSelfieUrl || '';

  container.innerHTML = `
    <div style="border-bottom: 3px solid #dc2626; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; font-size: 24px; color: #dc2626; font-family: sans-serif; font-weight: 900; letter-spacing: -0.5px;">
          RED FLAG HOMES
        </h1>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #52525b; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;">
          ${RED_FLAG_HOMES_COMPANY_INFO.tagline}
        </p>
      </div>
      <div style="text-align: right; font-family: monospace; font-size: 11px; color: #27272a;">
        <div><strong>OFFICIAL EXECUTED MOU</strong></div>
        <div style="color: #dc2626; font-weight: bold;">AGREEMENT ID: ${agreement.id}</div>
        <div>Date: ${agreement.effectiveDate || new Date().toISOString().split('T')[0]}</div>
      </div>
    </div>

    <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; font-size: 11px;">
      <div style="color: #991b1b; font-weight: bold; margin-bottom: 4px;">DIGITAL VERIFICATION SEAL & EXECUTED CONTRACT</div>
      <div style="color: #3f3f46;">
        This agreement is legally executed with digital verification under Indian Information Technology Act provisions.
      </div>
    </div>

    <div style="white-space: pre-wrap; margin-bottom: 24px; font-size: 11.5px; text-align: justify;">
      ${mouBody}
    </div>

    <div style="margin-top: 30px; border-top: 2px solid #e4e4e7; padding-top: 16px; page-break-inside: avoid;">
      <h3 style="font-family: sans-serif; font-size: 13px; margin: 0 0 12px 0; color: #09090b; text-transform: uppercase;">
        Execution Signatures & Verification Details
      </h3>

      <div style="display: flex; gap: 20px; font-family: sans-serif; font-size: 11px;">
        <!-- Party A Signature Box -->
        <div style="flex: 1; border: 1px solid #d4d4d8; padding: 12px; border-radius: 8px; background-color: #fafafa;">
          <div style="font-weight: bold; color: #09090b; margin-bottom: 4px;">PARTY A (PROPERTY OWNER)</div>
          <div><strong>Name:</strong> ${agreement.partyAName}</div>
          <div><strong>Mobile:</strong> ${agreement.partyAMobile || 'N/A'}</div>
          <div><strong>Email:</strong> ${agreement.partyAEmail || 'N/A'}</div>

          <div style="margin-top: 10px; border-top: 1px dashed #a1a1aa; padding-top: 8px; min-height: 50px;">
            <div style="font-size: 9px; color: #71717a; margin-bottom: 4px;">DIGITAL HAND SIGNATURE:</div>
            ${
              signatureData.startsWith('data:image')
                ? `<img src="${signatureData}" style="max-height: 45px; max-width: 180px; object-contain: contain;" />`
                : `<div style="font-family: cursive; font-size: 18px; color: #09090b; font-style: italic;">${signatureData || agreement.partyAName}</div>`
            }
          </div>
          <div style="font-size: 9px; color: #52525b; margin-top: 6px; font-family: monospace;">
            Signed At: ${signedDate}
          </div>
        </div>

        <!-- Party B Seal Box -->
        <div style="flex: 1; border: 1px solid #fca5a5; padding: 12px; border-radius: 8px; background-color: #fff5f5;">
          <div style="font-weight: bold; color: #dc2626; margin-bottom: 4px;">PARTY B (RED FLAG HOMES)</div>
          <div><strong>Entity:</strong> Red Flag Homes Network</div>
          <div><strong>Corporate Office:</strong> ${RED_FLAG_HOMES_COMPANY_INFO.address}</div>
          <div><strong>Official Desk:</strong> ${RED_FLAG_HOMES_COMPANY_INFO.email}</div>

          <div style="margin-top: 10px; border-top: 1px dashed #fca5a5; padding-top: 8px; text-align: center;">
            <div style="display: inline-block; border: 2px double #dc2626; color: #dc2626; padding: 4px 12px; font-weight: bold; border-radius: 6px; font-size: 10px; font-family: sans-serif;">
              OFFICIAL DIGITAL COMPANY SEAL
              <br />
              <span style="font-size: 8px; color: #7f1d1d;">RED FLAG HOMES NETWORK</span>
            </div>
          </div>
        </div>
      </div>

      ${
        auditTrail
          ? `
        <div style="margin-top: 16px; padding: 10px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #f4f4f5; font-family: monospace; font-size: 9.5px; color: #27272a;">
          <div style="font-weight: bold; color: #09090b; margin-bottom: 2px;">AUDIT TRAIL CERTIFICATE ID: ${auditTrail.certificateId}</div>
          <div>IP Address: ${auditTrail.ipAddress} | Timestamp: ${auditTrail.signedTimestamp}</div>
          <div>Hash (SHA-256): ${auditTrail.documentHash}</div>
        </div>
        `
          : ''
      }
    </div>

    <div style="margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 10px; font-family: sans-serif; font-size: 9px; color: #71717a; text-align: center;">
      Red Flag Homes Executive Portal • Guru Marg, Paschim Vihar, New Delhi • Official Email: agreements@redflaghomes.in
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
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
    console.error('Failed to generate PDF via html2canvas/jsPDF, falling back to print:', err);
    window.print();
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Downloads a separate Digital Audit Certificate PDF for the agreement
 */
export async function downloadAuditCertificatePdf(auditTrail: AuditTrail, agreement: AgreementData) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.backgroundColor = '#09090b';
  container.style.color = '#f4f4f5';
  container.style.padding = '40px';
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  container.style.boxSizing = 'border-box';

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

      <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <div style="color: #71717a; font-size: 11px; text-transform: uppercase; font-family: monospace;">Certificate Identifier</div>
        <div style="color: #10b981; font-size: 22px; font-weight: bold; font-family: monospace; margin: 4px 0;">
          ${auditTrail.certificateId}
        </div>
        <div style="color: #a1a1aa; font-size: 12px;">Verified Electronic Signature & Document Stamp</div>
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

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
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
    window.print();
  } finally {
    document.body.removeChild(container);
  }
}
