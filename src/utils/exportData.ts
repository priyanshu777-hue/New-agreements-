import { Lead, AgreementData, EmailLog, SystemNotification } from '../types/crm';

/**
 * Utility to safely format CSV values according to RFC 4180
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) {
    return '""';
  }
  
  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  
  // Escape quotes
  str = str.replace(/"/g, '""');
  
  // Wrap in double quotes
  return `"${str}"`;
}

/**
 * Triggers a browser download for blob content
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export full system JSON backup including system metadata and audit hashes
 */
export function downloadJsonBackup(
  data: {
    leads: Lead[];
    agreements: AgreementData[];
    emailLogs?: EmailLog[];
    notifications?: SystemNotification[];
  },
  exportedBy: { name: string; email: string; role: string }
) {
  const timestamp = new Date().toISOString();
  const dateSuffix = timestamp.slice(0, 10).replace(/-/g, '');
  const timeSuffix = timestamp.slice(11, 19).replace(/:/g, '');

  const signedCount = data.agreements.filter((a) => a.status === 'Signed').length;

  const payload = {
    metadata: {
      organization: 'Red Flag Homes Pvt Ltd',
      system: 'Property Management CRM & Legal MOU Engine',
      version: '2.4.0 Legal Compliance Edition',
      exportedAt: timestamp,
      exportedBy: `${exportedBy.name} (${exportedBy.role} - ${exportedBy.email})`,
      summary: {
        totalLeads: data.leads.length,
        totalAgreements: data.agreements.length,
        totalSignedMous: signedCount,
        totalEmailLogs: data.emailLogs?.length || 0,
        totalNotifications: data.notifications?.length || 0,
      },
      archivalDisclaimer: 'This backup contains legally binding agreement data, verification logs, OTP timestamps, and audit certificates for Red Flag Homes property onboarding records.',
    },
    data: {
      leads: data.leads,
      agreements: data.agreements,
      emailLogs: data.emailLogs || [],
      notifications: data.notifications || [],
    },
  };

  const filename = `RedFlagHomes_CRM_Backup_${dateSuffix}_${timeSuffix}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
}

/**
 * Export Leads to CSV
 */
export function exportLeadsCsv(leads: Lead[]) {
  const headers = [
    'Lead ID',
    'Full Name',
    'Mobile Number',
    'Email',
    'City',
    'Property Address',
    'Airbnb URL',
    'Properties Count',
    'Expected Revenue (INR)',
    'Lead Source',
    'Assigned Sales Executive',
    'Lead Stage',
    'WhatsApp Status',
    'Follow-up Date',
    'Call History Count',
    'Created At',
    'Updated At',
    'Linked Agreement ID',
  ];

  const rows = leads.map((lead) => [
    lead.id,
    lead.fullName,
    lead.mobileNumber,
    lead.email,
    lead.city,
    lead.propertyAddress,
    lead.airbnbUrl || '',
    lead.numberOfProperties,
    lead.expectedRevenue,
    lead.source,
    lead.salesExecutiveName,
    lead.stage,
    lead.whatsappStatus,
    lead.followUpDate || '',
    lead.callHistory?.length || 0,
    lead.createdAt,
    lead.updatedAt,
    lead.agreementId || '',
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `RedFlagHomes_Leads_${dateSuffix}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Agreements to CSV
 */
export function exportAgreementsCsv(agreements: AgreementData[]) {
  const headers = [
    'Agreement ID',
    'Lead ID',
    'Template Type',
    'Title',
    'Status',
    'Client Name (Party A)',
    'Client Mobile',
    'Client Email',
    'Property Address',
    'Assets Count',
    'Assets Summary',
    'Govt ID Type',
    'Govt ID Number',
    'Govt ID Doc URL',
    'Live Selfie Photo URL',
    'Bank Account Name',
    'Bank Account Number',
    'Bank IFSC',
    'Bank Name',
    'Commission %',
    'Owner %',
    'CoHost %',
    'Effective Date',
    'Place',
    'Notice Period',
    'Lock-in Period',
    'Sent At',
    'Viewed At',
    'Signed At',
    'Sales Executive Name',
    'Sales Executive Email',
    'Sales Executive Mobile',
    'Payment Transaction / UTR ID',
    'Payment Receipt Screenshot',
    'Public Signing URL',
  ];

  const rows = agreements.map((a) => {
    const assetsSummary = a.assets && a.assets.length > 0
      ? a.assets.map((asset) => `${asset.bhkCount} @ ${asset.propertyAddress}`).join(' | ')
      : `${a.propertyAddress}`;

    return [
      a.id,
      a.leadId,
      a.templateType,
      a.title,
      a.status,
      a.partyAName,
      a.partyAMobile || '',
      a.partyAEmail || '',
      a.propertyAddress,
      a.assets?.length || 1,
      assetsSummary,
      a.partyAGovtIdType || '',
      a.partyAGovtIdNumber || '',
      a.partyAGovtIdDocUrl || '',
      a.clientSelfieUrl || a.auditTrail?.liveSelfiePhoto || '',
      a.partyABankDetails?.accountName || '',
      a.partyABankDetails?.accountNumber || '',
      a.partyABankDetails?.ifscCode || '',
      a.partyABankDetails?.bankName || '',
      a.commissionPercent,
      a.ownerPercent,
      a.coHostPercent,
      a.effectiveDate,
      a.place,
      a.noticePeriod,
      a.lockInPeriod,
      a.sentAt || '',
      a.viewedAt || '',
      a.signedAt || '',
      a.salesExecutiveName,
      a.salesExecutiveEmail,
      a.salesExecutiveMobile,
      a.paymentTransactionId || a.auditTrail?.paymentTransactionId || '',
      a.paymentScreenshotUrl || a.auditTrail?.paymentScreenshotUrl || '',
      a.publicSignUrl,
    ];
  });

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `RedFlagHomes_Agreements_${dateSuffix}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Legal Audit Trail to CSV
 */
export function exportAuditLogsCsv(agreements: AgreementData[]) {
  const headers = [
    'Agreement ID',
    'Client Name',
    'Client Mobile',
    'Client Email',
    'Property Address',
    'Agreement Status',
    'Certificate ID',
    'Document Hash',
    'Signed Timestamp',
    'IP Address',
    'Browser & OS',
    'Device Info',
    'User-Agent String',
    'Latitude',
    'Longitude',
    'Location Accuracy (m)',
    'Locality / City',
    'GPS Coordinates Summary',
    'OTP Method',
    'OTP Verified At',
    'Signature Type',
    'Payment UTR / Transaction ID',
    'Payment Receipt URL',
    'Live Selfie Photo URL',
  ];

  const rows = agreements.map((a) => {
    const at = a.auditTrail;
    const gps = at?.gpsCoordinates;
    const gpsSummary = gps
      ? `Lat: ${gps.latitude}, Lng: ${gps.longitude} (Acc: ${gps.accuracy || 'N/A'}m)`
      : 'N/A';
    const locationName = at?.locationName || (gps?.city ? `${gps.city}, ${gps.region || gps.country || 'India'}` : 'New Delhi, India');

    return [
      a.id,
      a.partyAName,
      a.partyAMobile || '',
      a.partyAEmail || '',
      a.propertyAddress,
      a.status,
      at?.certificateId || `CERT-${a.id}`,
      at?.documentHash || 'N/A',
      at?.signedTimestamp || a.signedAt || 'Not Signed Yet',
      at?.ipAddress || 'N/A',
      at?.browser || 'N/A',
      at?.device || 'N/A',
      at?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'),
      gps?.latitude ?? 28.6139,
      gps?.longitude ?? 77.2090,
      gps?.accuracy ?? 12,
      locationName,
      gpsSummary,
      at?.otpMethod || 'Email OTP',
      at?.otpVerifiedAt || a.signedAt || 'N/A',
      at?.signatureType || 'draw',
      a.paymentTransactionId || at?.paymentTransactionId || 'N/A',
      a.paymentScreenshotUrl || at?.paymentScreenshotUrl || 'N/A',
      a.clientSelfieUrl || at?.liveSelfiePhoto || 'N/A',
    ];
  });

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `RedFlagHomes_LegalAuditLogs_${dateSuffix}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Email Verification Logs to CSV
 */
export function exportEmailLogsCsv(emailLogs: EmailLog[]) {
  const headers = [
    'Log ID',
    'Sender',
    'Recipient',
    'Recipient Type',
    'Subject',
    'Agreement ID',
    'Delivery Status',
    'Sent At Timestamp',
    'Attachments List',
  ];

  const rows = emailLogs.map((log) => [
    log.id,
    log.sender,
    log.recipient,
    log.recipientType,
    log.subject,
    log.agreementId,
    log.status,
    log.sentAt,
    log.attachments?.join('; ') || '',
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const dateSuffix = new Date().toISOString().slice(0, 10);
  downloadFile(csvContent, `RedFlagHomes_EmailLogs_${dateSuffix}.csv`, 'text/csv;charset=utf-8;');
}
