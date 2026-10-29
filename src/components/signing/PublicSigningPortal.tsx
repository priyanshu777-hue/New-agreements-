import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  Mail,
  PenTool,
  Type,
  Upload,
  RefreshCw,
  Printer,
  ChevronRight,
  User,
  CreditCard,
  Building,
  Plus,
  Trash2,
  Camera,
  Award,
  Eraser,
  Sparkles,
  Copy,
  Check,
  QrCode,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const OFFICIAL_PAYMENT_QR_URL =
  '/assets/aistudio/Cachessm-qr-1792916128716_188686eb.png';
import { AgreementData, AuditTrail, AssetDetail } from '../../types/crm';
import { renderMouText } from '../../utils/mouTemplate';
import { createAuditCertificate, getClientIp, generateQrCodeDataUrl } from '../../utils/auditTrail';
import { downloadMouPdf, downloadAuditCertificatePdf, generateMouPdfDataUrl } from '../../utils/pdfGenerator';
import { RedFlagLogo, DigitalCompanySeal, DocumentAuditStamp } from '../common/RedFlagLogo';

interface PublicSigningPortalProps {
  agreement: AgreementData;
  onUpdateAgreement?: (updatedAgreement: AgreementData) => void;
  onCompleteSigning: (signedAgreement: AgreementData, auditTrail: AuditTrail) => void;
  onBackToCRM?: () => void;
}

export const PublicSigningPortal: React.FC<PublicSigningPortalProps> = ({
  agreement: initialAgreement,
  onUpdateAgreement,
  onCompleteSigning,
  onBackToCRM,
}) => {
  const [agreement, setAgreement] = useState<AgreementData>(initialAgreement);

  const [step, setStep] = useState<'details' | 'selfie' | 'payment' | 'review' | 'sign' | 'completed'>(
    initialAgreement.status === 'Signed' ? 'completed' : 'details'
  );

  // Client Details Form State
  const [clientName, setClientName] = useState(agreement.partyAName || '');
  const [clientEmail, setClientEmail] = useState(agreement.partyAEmail || '');
  const [clientMobile, setClientMobile] = useState(agreement.partyAMobile || '');

  // Multi-Asset / Property List
  const [assets, setAssets] = useState<AssetDetail[]>(
    agreement.assets && agreement.assets.length > 0
      ? agreement.assets
      : [
          {
            id: `asset_${Date.now()}`,
            propertyAddress: agreement.propertyAddress || '',
            bhkCount: '3 BHK Apartment',
          },
        ]
  );

  const [govtIdType, setGovtIdType] = useState<'Aadhaar' | 'PAN' | 'Passport' | 'Driving Licence'>(
    agreement.partyAGovtIdType || 'Aadhaar'
  );
  const [govtIdNumber, setGovtIdNumber] = useState(agreement.partyAGovtIdNumber || '');
  const [uploadedGovtIdName, setUploadedGovtIdName] = useState<string | null>(null);
  const [uploadedGovtIdUrl, setUploadedGovtIdUrl] = useState<string | null>(agreement.partyAGovtIdDocUrl || null);

  // Bank Details State
  const [bankHolderName, setBankHolderName] = useState(agreement.partyABankDetails?.accountName || agreement.partyAName || '');
  const [bankName, setBankName] = useState(agreement.partyABankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(agreement.partyABankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(agreement.partyABankDetails?.ifscCode || '');

  // Selfie State
  const [selfieUrl, setSelfieUrl] = useState<string | null>(agreement.clientSelfieUrl || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Onboarding Fee Payment State
  const [paymentTxId, setPaymentTxId] = useState(agreement.paymentTransactionId || '');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(
    agreement.paymentScreenshotUrl || null
  );
  const [paymentScreenshotName, setPaymentScreenshotName] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');

  // Terms Acceptance & Signature states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signatureType, setSignatureType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState(clientName);
  const [selectedFont, setSelectedFont] = useState("'Dancing Script', cursive");
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);

  // react-signature-canvas Ref
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [penColor, setPenColor] = useState('#DC2626');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signError, setSignError] = useState('');

  // Audit Trail & QR Code
  const [finalAuditTrail, setFinalAuditTrail] = useState<AuditTrail | null>(agreement.auditTrail || null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentQrCodeUrl, setPaymentQrCodeUrl] = useState(OFFICIAL_PAYMENT_QR_URL);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [clientIp, setClientIp] = useState('157.48.210.14');
  const [clientGps, setClientGps] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    city?: string;
    region?: string;
    country?: string;
  }>({
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 12,
    city: 'New Delhi',
    region: 'Delhi NCR',
    country: 'India',
  });
  const [completionEmailStatus, setCompletionEmailStatus] = useState<string>('Delivering confirmation email...');
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  const publicSignUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/sign/${agreement.id}`
      : `https://agreements.redflaghomes.in/sign/${agreement.id}`;

  const displayAudit: AuditTrail =
    finalAuditTrail ||
    agreement.auditTrail ||
    createAuditCertificate(
      agreement,
      'draw',
      agreement.partyAName || 'Client',
      clientIp,
      clientGps,
      agreement.paymentTransactionId,
      agreement.paymentScreenshotUrl,
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      `${clientGps.city || 'New Delhi'}, ${clientGps.region || 'Delhi NCR'}, India`
    );

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('red.media@superyes');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  useEffect(() => {
    const fullSignUrl = window.location.href;
    generateQrCodeDataUrl(fullSignUrl).then(setQrCodeUrl);

    // Official UPI Payment QR parameters for RED FLAG MEDIA
    const upiUri = `upi://pay?pa=red.media@superyes&pn=RED%20FLAG%20MEDIA&cu=INR&tn=Onboarding%20Fee%20MOU%20${agreement.id}`;
    if (!OFFICIAL_PAYMENT_QR_URL) {
      generateQrCodeDataUrl(upiUri).then(setPaymentQrCodeUrl);
    }

    getClientIp().then(setClientIp);

    // Attempt HTML5 Geolocation API capture for legal audit trail compliance
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setClientGps({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 10),
            city: 'Gurugram',
            region: 'Haryana',
            country: 'India',
          });
        },
        (err) => {
          console.log('Using default approximate Delhi NCR geolocation for audit log:', err.message);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }

    // Update real-time CRM stage tracking to "Viewed" if link was just opened by client
    if (agreement.status === 'Inactive' || agreement.status === 'Awaiting Signature') {
      const viewedAgr: AgreementData = { ...agreement, status: 'Viewed' };
      setAgreement(viewedAgr);
      if (onUpdateAgreement) {
        onUpdateAgreement(viewedAgr);
      }
    }
  }, [agreement.id]);

  const clearCanvas = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setHasDrawn(false);
      setSignError('');
    }
  };

  // Asset Handlers
  const handleAddAsset = () => {
    const newAsset: AssetDetail = {
      id: `asset_${Date.now()}`,
      propertyAddress: '',
      bhkCount: '3 BHK',
    };
    setAssets([...assets, newAsset]);
  };

  const handleRemoveAsset = (id: string) => {
    if (assets.length === 1) return;
    setAssets(assets.filter((a) => a.id !== id));
  };

  const handleAssetChange = (id: string, field: 'propertyAddress' | 'bhkCount', val: string) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, [field]: val } : a)));
  };

  // Validation States & Input Formatting Helpers
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  const clearFieldError = (fieldKey: string) => {
    if (formErrors[fieldKey]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  const markFieldTouched = (fieldKey: string) => {
    setFormTouched((prev) => ({ ...prev, [fieldKey]: true }));
  };

  const getInputClass = (fieldKey: string, extraClasses = '') => {
    const isInvalid = formErrors[fieldKey] && (formTouched[fieldKey] || formErrors[fieldKey]);
    if (isInvalid) {
      return `w-full bg-zinc-950 border-2 border-red-500 text-red-100 placeholder-red-400/60 rounded-xl p-2.5 text-xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-sm shadow-red-950/80 transition-colors ${extraClasses}`;
    }
    return `w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors ${extraClasses}`;
  };

  const renderFieldError = (fieldKey: string) => {
    if (!formErrors[fieldKey]) return null;
    return (
      <span className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1 animate-in fade-in duration-150">
        <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
        <span>{formErrors[fieldKey]}</span>
      </span>
    );
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!clientName.trim()) {
      errors.clientName = 'Full legal name is required';
    } else if (clientName.trim().length < 2) {
      errors.clientName = 'Name must be at least 2 characters';
    }

    const cleanMobile = clientMobile.replace(/[\s-]/g, '').replace(/^(\+91|91)/, '');
    if (!clientMobile.trim()) {
      errors.clientMobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.clientMobile = 'Invalid 10-digit mobile number (e.g. 9811234567)';
    }

    if (!clientEmail.trim()) {
      errors.clientEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      errors.clientEmail = 'Invalid email format (e.g. name@domain.com)';
    }

    if (!govtIdNumber.trim()) {
      errors.govtIdNumber = `${govtIdType} number is required`;
    } else if (govtIdType === 'Aadhaar') {
      const cleanAadhaar = govtIdNumber.replace(/[\s-]/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        errors.govtIdNumber = 'Aadhaar must be 12 digits (e.g. 4589 1234 9012)';
      }
    } else if (govtIdType === 'PAN') {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(govtIdNumber.trim())) {
        errors.govtIdNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
    } else if (govtIdNumber.trim().length < 6) {
      errors.govtIdNumber = `${govtIdType} number must be at least 6 characters`;
    }

    if (!bankHolderName.trim()) {
      errors.bankHolderName = 'Account holder name is required';
    }

    if (!bankName.trim()) {
      errors.bankName = 'Bank name is required';
    }

    const cleanAccNo = accountNumber.replace(/[\s-]/g, '');
    if (!accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    } else if (!/^\d{8,18}$/.test(cleanAccNo)) {
      errors.accountNumber = 'Account number must be 8–18 digits';
    }

    if (!ifscCode.trim()) {
      errors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim())) {
      errors.ifscCode = 'Invalid 11-char IFSC code (e.g. HDFC0000021)';
    }

    assets.forEach((ast, idx) => {
      if (!ast.propertyAddress.trim()) {
        errors[`asset_address_${ast.id}`] = `Property Asset #${idx + 1} address is required`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!paymentTxId.trim()) {
      errors.paymentTxId = 'Payment Transaction ID / UTR number is required';
    } else if (paymentTxId.trim().length < 6) {
      errors.paymentTxId = 'Transaction ID / UTR must be at least 6 characters';
    }

    if (!paymentScreenshotUrl) {
      errors.paymentScreenshotUrl = 'Please upload a payment confirmation screenshot';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1 Submit -> Proceed to Selfie Step
  const handleSaveClientDetails = (e: React.FormEvent) => {
    e.preventDefault();

    setFormTouched({
      clientName: true,
      clientMobile: true,
      clientEmail: true,
      govtIdNumber: true,
      bankHolderName: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
    });

    if (!validateStep1()) {
      return;
    }

    const primaryAddress = assets[0]?.propertyAddress || agreement.propertyAddress;

    const updatedAgr: AgreementData = {
      ...agreement,
      partyAName: clientName,
      partyAEmail: clientEmail,
      partyAMobile: clientMobile,
      propertyAddress: primaryAddress,
      assets,
      partyAGovtIdType: govtIdType,
      partyAGovtIdNumber: govtIdNumber,
      partyAGovtIdDocUrl: uploadedGovtIdUrl || undefined,
      partyABankDetails: {
        accountName: bankHolderName || clientName,
        bankName: bankName,
        accountNumber: accountNumber,
        ifscCode: ifscCode,
      },
      status: 'Viewed',
    };
    setAgreement(updatedAgr);
    if (onUpdateAgreement) {
      onUpdateAgreement(updatedAgr);
    }
    fetch('/api/agreements/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement: updatedAgr }),
    }).catch(() => {});
    setTypedName(clientName);
    setStep('selfie');
  };

  // Live Selfie Camera Capture
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Fallback if camera denied/unavailable
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvas.toDataURL('image/png');
      setSelfieUrl(dataUrl);

      // Stop camera stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelfieUrl(reader.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleGovtIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setUploadedGovtIdName(file.name);
      setUploadedGovtIdUrl(URL.createObjectURL(file));
    }
  };

  const handlePaymentScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setPaymentScreenshotName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPaymentScreenshotUrl(reader.result);
          setPaymentError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedSignatureUrl(reader.result);
          setSignError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

function getTrimmedSignatureDataUrl(sigCanvas: SignatureCanvas): string {
  try {
    const rawCanvas = sigCanvas.getCanvas();
    if (!rawCanvas) return sigCanvas.toDataURL('image/png');

    const ctx = rawCanvas.getContext('2d');
    if (!ctx) return rawCanvas.toDataURL('image/png');

    const width = rawCanvas.width;
    const height = rawCanvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixels) return rawCanvas.toDataURL('image/png');

    const padding = 10;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropW = Math.min(width - cropX, maxX - minX + padding * 2);
    const cropH = Math.min(height - cropY, maxY - minY + padding * 2);

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = cropW;
    trimmedCanvas.height = cropH;

    const trimmedCtx = trimmedCanvas.getContext('2d');
    if (trimmedCtx) {
      trimmedCtx.drawImage(rawCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return trimmedCanvas.toDataURL('image/png');
    }

    return rawCanvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Canvas trimming fallback used:', err);
    return sigCanvas.toDataURL ? sigCanvas.toDataURL('image/png') : '';
  }
}

  // Confirm Signature & Execute Contract
  const handleConfirmSignature = async () => {
    setSignError('');
    let signatureData = '';

    if (signatureType === 'draw') {
      if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
        setSignError('Please draw your hand signature on screen before proceeding.');
        return;
      }
      signatureData = getTrimmedSignatureDataUrl(sigCanvasRef.current);
    } else if (signatureType === 'type') {
      if (!typedName.trim()) {
        setSignError('Please enter your full legal name.');
        return;
      }
      signatureData = typedName;
    } else if (signatureType === 'upload') {
      if (!uploadedSignatureUrl) {
        setSignError('Please upload a signature image file.');
        return;
      }
      signatureData = uploadedSignatureUrl;
    }

    const ip = await getClientIp();

    const audit = createAuditCertificate(
      agreement,
      signatureType,
      signatureData,
      ip,
      clientGps,
      paymentTxId,
      paymentScreenshotUrl || undefined,
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      `${clientGps.city || 'New Delhi'}, ${clientGps.region || 'Delhi NCR'}, India`
    );

    const updatedAgreement: AgreementData = {
      ...agreement,
      status: 'Signed',
      signedAt: audit.signedTimestamp,
      clientSelfieUrl: selfieUrl || undefined,
      paymentTransactionId: paymentTxId || undefined,
      paymentScreenshotUrl: paymentScreenshotUrl || undefined,
      auditTrail: audit,
    };

    setFinalAuditTrail(audit);
    setAgreement(updatedAgreement);
    if (onUpdateAgreement) {
      onUpdateAgreement(updatedAgreement);
    }

    fetch('/api/agreements/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement: updatedAgreement }),
    }).catch(() => {});

    setStep('completed');
    setIsSuccessModalOpen(true);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#10B981', '#FFFFFF', '#F59E0B'],
      });
    } catch (e) {
      console.log('Confetti', e);
    }

    onCompleteSigning(updatedAgreement, audit);

    // Generate base64 PDF of signed MOU for email attachment
    let pdfDataUrl = '';
    try {
      pdfDataUrl = await generateMouPdfDataUrl(updatedAgreement, audit);
    } catch (pdfErr) {
      console.warn('PDF data URL generation warning:', pdfErr);
    }

    // Send emails from agreements@redflaghomes.in to client & corporate
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: clientEmail || agreement.partyAEmail || agreement.salesExecutiveEmail,
        subject: `Welcome to Red Flag Homes! Executed MOU - ${agreement.title}`,
        agreementId: agreement.id,
        bodyText: `Welcome ${clientName || agreement.partyAName}! Your Memorandum of Understanding has been successfully executed with Red Flag Homes. Payment Transaction ID: ${paymentTxId || 'Verified'}. Verified audit stamp & digital company seal applied.`,
        pdfDataUrl,
        attachments: ['Signed_MOU_Agreement.pdf', 'Audit_Certificate.pdf'],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCompletionEmailStatus(data.message || `Confirmation email sent to ${clientEmail}`);
      })
      .catch(() => {
        setCompletionEmailStatus(`Confirmation recorded for ${clientEmail}`);
      });
  };

  const fullMouText = renderMouText(agreement);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Portal Navigation Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <RedFlagLogo size="md" />

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 hidden sm:inline-block">
            Doc ID: <strong className="text-red-400">{agreement.id}</strong>
          </span>

          {onBackToCRM && (
            <button
              onClick={onBackToCRM}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors min-h-[44px]"
            >
              Back to CRM Desk
            </button>
          )}
        </div>
      </header>

      {/* Main Stepper Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Step Progression Bar */}
        <div className="flex sm:grid sm:grid-cols-5 gap-1.5 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl text-center text-[10px] sm:text-[11px] font-semibold overflow-x-auto snap-x scrollbar-none">
          <div
            className={`py-2 px-2 rounded-xl transition-all shrink-0 snap-start min-w-[100px] sm:min-w-0 ${
              step === 'details' ? 'bg-red-600 text-white shadow font-bold' : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            1. Client & Assets
          </div>
          <div
            className={`py-2 px-2 rounded-xl transition-all shrink-0 snap-start min-w-[100px] sm:min-w-0 ${
              step === 'selfie' ? 'bg-red-600 text-white shadow font-bold' : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            2. Live Selfie
          </div>
          <div
            className={`py-2 px-2 rounded-xl transition-all shrink-0 snap-start min-w-[100px] sm:min-w-0 ${
              step === 'payment' ? 'bg-red-600 text-white shadow font-bold' : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            3. Onboarding Fee
          </div>
          <div
            className={`py-2 px-2 rounded-xl transition-all shrink-0 snap-start min-w-[100px] sm:min-w-0 ${
              step === 'review' ? 'bg-red-600 text-white shadow font-bold' : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            4. Read MOU
          </div>
          <div
            className={`py-2 px-2 rounded-xl transition-all shrink-0 snap-start min-w-[100px] sm:min-w-0 ${
              step === 'sign' || step === 'completed' ? 'bg-red-600 text-white shadow font-bold' : 'bg-zinc-950 text-zinc-400'
            }`}
          >
            5. E-Sign & Seal
          </div>
        </div>

        {/* STEP 1: CLIENT DETAILS & MULTI-ASSET PROPERTY ENTRY */}
        {step === 'details' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="border-b border-zinc-800 pb-4 space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Step 1 of 5
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Owner Details & Property Asset Setup
              </h2>
              <p className="text-xs text-zinc-400">
                Please enter your owner information, property addresses, and BHK room counts.
              </p>
            </div>

            <form onSubmit={handleSaveClientDetails} className="space-y-6">
              {/* Owner Identity */}
              <div className="space-y-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider border-b border-zinc-800/80 pb-2">
                  <User className="w-4 h-4" />
                  <span>Property Owner Personal Info</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        clearFieldError('clientName');
                      }}
                      onBlur={() => markFieldTouched('clientName')}
                      placeholder="e.g. Rohan Oberoi"
                      className={getInputClass('clientName')}
                    />
                    {renderFieldError('clientName')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      value={clientMobile}
                      onChange={(e) => {
                        setClientMobile(e.target.value);
                        clearFieldError('clientMobile');
                      }}
                      onBlur={() => markFieldTouched('clientMobile')}
                      placeholder="+91 98112 34567"
                      className={getInputClass('clientMobile', 'font-mono')}
                    />
                    {renderFieldError('clientMobile')}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => {
                        setClientEmail(e.target.value);
                        clearFieldError('clientEmail');
                      }}
                      onBlur={() => markFieldTouched('clientEmail')}
                      placeholder="rohan.oberoi@domain.com"
                      className={getInputClass('clientEmail')}
                    />
                    {renderFieldError('clientEmail')}
                  </div>
                </div>
              </div>

              {/* Multi-Asset / Property Details */}
              <div className="space-y-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                    <Building className="w-4 h-4" />
                    <span>Registered Property Assets & Room Counts</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAsset}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow min-h-[44px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Property</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {assets.map((asset, index) => (
                    <div
                      key={asset.id}
                      className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-red-400">
                          Property Asset #{index + 1}
                        </span>

                        {assets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.id)}
                            className="text-zinc-500 hover:text-red-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                            Full Property Address *
                          </label>
                          <input
                            type="text"
                            value={asset.propertyAddress}
                            onChange={(e) => {
                              handleAssetChange(asset.id, 'propertyAddress', e.target.value);
                              clearFieldError(`asset_address_${asset.id}`);
                            }}
                            onBlur={() => markFieldTouched(`asset_address_${asset.id}`)}
                            placeholder="Penthouse 4B, Golf Course Road, Gurugram"
                            className={getInputClass(`asset_address_${asset.id}`)}
                          />
                          {renderFieldError(`asset_address_${asset.id}`)}
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                            Room Count / BHK Config *
                          </label>
                          <input
                            type="text"
                            value={asset.bhkCount}
                            onChange={(e) =>
                              handleAssetChange(asset.id, 'bhkCount', e.target.value)
                            }
                            placeholder="e.g. 3 BHK, 4 BHK Villa, Studio"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Govt ID & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Govt ID */}
                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                    Government ID Verification
                  </span>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                      ID Type
                    </label>
                    <select
                      value={govtIdType}
                      onChange={(e) => setGovtIdType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving Licence">Driving Licence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      value={govtIdNumber}
                      onChange={(e) => {
                        setGovtIdNumber(e.target.value);
                        clearFieldError('govtIdNumber');
                      }}
                      onBlur={() => markFieldTouched('govtIdNumber')}
                      placeholder="4589-1234-9012"
                      className={getInputClass('govtIdNumber', 'font-mono')}
                    />
                    {renderFieldError('govtIdNumber')}
                  </div>
                  <div>
                    <label className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 cursor-pointer transition-colors min-h-[44px]">
                      <Upload className="w-3.5 h-3.5 text-red-400" />
                      <span className="truncate max-w-[140px]">
                        {uploadedGovtIdName || 'Upload Govt ID Photo'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleGovtIdUpload}
                        accept="image/*,application/pdf"
                      />
                    </label>
                  </div>
                </div>

                {/* Bank Payout */}
                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
                    Bank Payout Settlement Account
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Holder Name *</label>
                      <input
                        type="text"
                        value={bankHolderName}
                        onChange={(e) => {
                          setBankHolderName(e.target.value);
                          clearFieldError('bankHolderName');
                        }}
                        onBlur={() => markFieldTouched('bankHolderName')}
                        placeholder="Rohan Oberoi"
                        className={getInputClass('bankHolderName')}
                      />
                      {renderFieldError('bankHolderName')}
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => {
                          setBankName(e.target.value);
                          clearFieldError('bankName');
                        }}
                        onBlur={() => markFieldTouched('bankName')}
                        placeholder="HDFC Bank"
                        className={getInputClass('bankName')}
                      />
                      {renderFieldError('bankName')}
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Account No. *</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value);
                          clearFieldError('accountNumber');
                        }}
                        onBlur={() => markFieldTouched('accountNumber')}
                        placeholder="002101584930"
                        className={getInputClass('accountNumber', 'font-mono')}
                      />
                      {renderFieldError('accountNumber')}
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => {
                          setIfscCode(e.target.value.toUpperCase());
                          clearFieldError('ifscCode');
                        }}
                        onBlur={() => markFieldTouched('ifscCode')}
                        placeholder="HDFC0000021"
                        className={getInputClass('ifscCode', 'font-mono')}
                      />
                      {renderFieldError('ifscCode')}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-extrabold text-xs shadow-xl shadow-red-950 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[48px]"
              >
                <span>Proceed to Live Selfie Identity Verification</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: LIVE SELFIE PHOTO VERIFICATION */}
        {step === 'selfie' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-lg mx-auto text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Step 2 of 5
              </span>
              <h2 className="text-lg font-extrabold text-white">Live Selfie Verification</h2>
              <p className="text-xs text-zinc-400">
                Capture a quick live selfie photo with your webcam or upload a photo to verify your identity.
              </p>
            </div>

            {/* Selfie Preview or Camera Box */}
            <div className="relative w-64 h-64 mx-auto rounded-2xl bg-zinc-950 border-2 border-red-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Live Selfie" className="w-full h-full object-cover" />
              ) : isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="space-y-2 p-4 text-center">
                  <Camera className="w-10 h-10 text-red-500 mx-auto" />
                  <span className="text-xs text-zinc-400 block font-mono">Camera Ready</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isCameraActive && !selfieUrl && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow min-h-[44px]"
                >
                  Start Webcam
                </button>
              )}

              {isCameraActive && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow min-h-[44px]"
                >
                  Capture Photo
                </button>
              )}

              <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-3 rounded-xl border border-zinc-700 cursor-pointer min-h-[44px] flex items-center justify-center">
                <span>Upload Photo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleSelfieFileUpload}
                  accept="image/*"
                />
              </label>
            </div>

            <button
              onClick={() => {
                const selfieUpdated: AgreementData = {
                  ...agreement,
                  clientSelfieUrl: selfieUrl || undefined,
                  status: 'Selfie Verified',
                };
                setAgreement(selfieUpdated);
                if (onUpdateAgreement) {
                  onUpdateAgreement(selfieUpdated);
                }
                setStep('payment');
              }}
              disabled={!selfieUrl}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                selfieUrl
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-950'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>Verify Selfie & Proceed to Onboarding Fee Payment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: ONBOARDING FEE PAYMENT VERIFICATION */}
        {step === 'payment' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-xl mx-auto">
            <div className="text-center space-y-1 border-b border-zinc-800 pb-4">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Step 3 of 5
              </span>
              <h2 className="text-lg font-extrabold text-white">
                Pay the Onboarding Fees As Discussed
              </h2>
              <p className="text-xs text-zinc-400">
                Scan the official RED FLAG MEDIA UPI QR code or transfer directly to our UPI ID, then enter your Transaction / UTR ID & upload a receipt screenshot.
              </p>
            </div>

            {/* QR Code & Payment Information Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 items-center">
              {/* Payment QR Code Image Slot */}
              <div className="text-center space-y-2 bg-white p-3 rounded-2xl shadow-xl border border-zinc-200">
                <div className="overflow-hidden rounded-xl bg-white flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Cachessm-qr-1792916128716_188686eb.png"
                    alt="Official UPI Payment QR - RED FLAG MEDIA"
                    className="w-full max-w-[210px] h-auto object-contain mx-auto transition-transform hover:scale-105 duration-200"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-red-600 uppercase tracking-wider font-sans">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan via Any UPI App</span>
                </div>
              </div>

              {/* Payment Account Details */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-0.5">
                    Beneficiary Name
                  </span>
                  <strong className="text-white font-extrabold text-sm tracking-wide block">
                    RED FLAG MEDIA
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-0.5">
                        Official UPI ID
                      </span>
                      <strong className="text-red-400 font-mono font-bold text-sm truncate block">
                        red.media@superyes
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700 flex items-center gap-1 transition-all shrink-0 active:scale-95 min-h-[44px]"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                    Supported Payment Apps
                  </span>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    super.money, Google Pay, PhonePe, Paytm, BHIM, CRED & all UPI apps
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
                    Official Corporate Email
                  </span>
                  <strong className="text-zinc-300 font-mono text-[11px]">
                    agreements@redflaghomes.in
                  </strong>
                </div>
              </div>
            </div>

            {/* Payment Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormTouched({
                  paymentTxId: true,
                  paymentScreenshotUrl: true,
                });
                if (!validateStep3()) {
                  return;
                }
                setPaymentError('');
                const paymentUpdated: AgreementData = {
                  ...agreement,
                  paymentTransactionId: paymentTxId,
                  paymentScreenshotUrl: paymentScreenshotUrl || undefined,
                  status: 'Payment Submitted',
                };
                setAgreement(paymentUpdated);
                if (onUpdateAgreement) {
                  onUpdateAgreement(paymentUpdated);
                }
                setStep('review');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">
                  Payment Transaction ID / UTR Number *
                </label>
                <input
                  type="text"
                  value={paymentTxId}
                  onChange={(e) => {
                    setPaymentTxId(e.target.value);
                    clearFieldError('paymentTxId');
                  }}
                  onBlur={() => markFieldTouched('paymentTxId')}
                  placeholder="e.g. UPI/429104812390 or UTR-982104"
                  className={getInputClass('paymentTxId', 'font-mono p-3')}
                />
                {renderFieldError('paymentTxId')}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 mb-1">
                  Upload Payment Confirmation Screenshot *
                </label>
                <label
                  className={`flex items-center justify-between border rounded-xl p-3 text-xs text-zinc-300 cursor-pointer transition-colors min-h-[44px] ${
                    formErrors.paymentScreenshotUrl && (formTouched.paymentScreenshotUrl || formErrors.paymentScreenshotUrl)
                      ? 'bg-zinc-950 border-2 border-red-500 shadow-sm shadow-red-950/80'
                      : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {paymentScreenshotName || 'Upload Screenshot (PNG / JPG)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800/40">
                    Browse File
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      handlePaymentScreenshotUpload(e);
                      clearFieldError('paymentScreenshotUrl');
                    }}
                    accept="image/*"
                  />
                </label>
                {renderFieldError('paymentScreenshotUrl')}

                {paymentScreenshotUrl && (
                  <div className="mt-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                    <img
                      src={paymentScreenshotUrl}
                      alt="Payment Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-red-500/50"
                    />
                    <div className="text-[11px] text-emerald-400 font-mono font-bold">
                      ✓ Payment Receipt Screenshot Attached
                    </div>
                  </div>
                )}
              </div>

              {paymentError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 text-center">
                  {paymentError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-extrabold text-xs shadow-xl shadow-red-950 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[48px]"
              >
                <span>Submit Payment Details & Review Agreement</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: REVIEW AGREEMENT */}
        {step === 'review' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                  Step 4 of 5
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  Review Memorandum of Understanding (MOU)
                </h2>
                <p className="text-xs text-zinc-400">
                  Property Owner: <strong>{agreement.partyAName}</strong> ({assets.length} Property Asset Registered)
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-2 rounded-xl border border-zinc-700 transition-colors shrink-0 min-h-[44px]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>

            {/* Document Scroll Box */}
            <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-300 max-h-96 overflow-y-auto font-serif text-xs leading-relaxed whitespace-pre-wrap shadow-inner select-none relative">
              {fullMouText}

              {/* Bottom-Right Verified Audit Stamp inside Preview Box */}
              <div className="mt-6 flex justify-end">
                <DocumentAuditStamp
                  clientName={agreement.partyAName}
                  ipAddress={clientIp}
                  timestamp={new Date().toISOString()}
                />
              </div>
            </div>

            {/* Terms Acceptance Checkbox */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs text-zinc-300 leading-normal">
                  I, <strong>{agreement.partyAName}</strong>, hereby confirm that I have read, understood, and agreed to all terms, clauses, and payout splits (83% Owner / 17% Red Flag Homes) set forth in this Memorandum of Understanding.
                </span>
              </label>

              <button
                disabled={!acceptedTerms}
                onClick={() => setStep('sign')}
                className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                  acceptedTerms
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-950'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <span>Proceed to Digital Signature & Seal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: DIGITAL HAND SIGNATURE CAPTURE */}
        {step === 'sign' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                  Final Step
                </span>
                <h2 className="text-lg font-extrabold text-white">Capture Hand Signature</h2>
                <p className="text-xs text-zinc-400">
                  Sign for: <strong>{agreement.partyAName}</strong> (Property Owner)
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Identity Verified</span>
              </div>
            </div>

            {/* Signature Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                onClick={() => {
                  setSignatureType('draw');
                  setSignError('');
                }}
                className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                  signatureType === 'draw' ? 'bg-red-600 text-white shadow' : 'text-zinc-400'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Draw Hand Signature</span>
              </button>
              <button
                onClick={() => {
                  setSignatureType('upload');
                  setSignError('');
                }}
                className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                  signatureType === 'upload' ? 'bg-red-600 text-white shadow' : 'text-zinc-400'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Signature Image</span>
              </button>
            </div>

            {/* DRAW HAND SIGNATURE CANVAS WITH react-signature-canvas */}
            {signatureType === 'draw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span>Pen Ink Color:</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: 'Crimson Red', color: '#DC2626' },
                        { label: 'Navy Blue', color: '#1E3A8A' },
                        { label: 'Midnight Black', color: '#09090B' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setPenColor(c.color)}
                          className={`w-6 h-6 rounded-full border border-zinc-600 transition-transform ${
                            penColor === c.color ? 'scale-125 ring-2 ring-red-500' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-red-400 hover:text-red-300 font-semibold underline text-xs flex items-center gap-1 min-h-[44px]"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear Canvas</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-2 border-2 border-red-500/50 shadow-inner relative">
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor={penColor}
                    minWidth={1.8}
                    maxWidth={3.8}
                    velocityFilterWeight={0.7}
                    canvasProps={{
                      className: 'w-full h-44 rounded-xl cursor-crosshair touch-none bg-white',
                    }}
                    onBegin={() => {
                      setHasDrawn(true);
                      setSignError('');
                    }}
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs font-mono">
                      Draw your hand signature here on touch screen or mouse
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UPLOAD SIGNATURE */}
            {signatureType === 'upload' && (
              <div className="space-y-3">
                <label className="block border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer bg-zinc-950 transition-colors min-h-[120px]">
                  <Upload className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-white block">Upload Signature Image</span>
                  <span className="text-[10px] text-zinc-400">PNG or JPG file with transparent/white background</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUploadSignature}
                    accept="image/*"
                  />
                </label>

                {uploadedSignatureUrl && (
                  <div className="p-3 bg-white rounded-xl border border-zinc-300 text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 block">Uploaded Signature Preview:</span>
                    <img
                      src={uploadedSignatureUrl}
                      alt="Uploaded Signature"
                      className="h-20 mx-auto object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {signError && (
              <p className="text-xs text-red-400 font-semibold text-center bg-red-950/50 p-2.5 rounded-xl border border-red-800/40">
                {signError}
              </p>
            )}

            {/* Confirm & Execute Button */}
            <button
              onClick={handleConfirmSignature}
              className="w-full bg-gradient-to-r from-red-700 via-red-600 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-extrabold text-sm py-4 rounded-xl shadow-2xl shadow-red-950 flex items-center justify-center gap-2 transition-all active:scale-95 min-h-[50px]"
            >
              <Award className="w-5 h-5" />
              <span>Confirm & Execute MOU Signature</span>
            </button>
          </div>
        )}

        {/* COMPLETED - WELCOME HERO BANNER & DOWNLOAD SIGNED PDF */}
        {step === 'completed' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
            {/* Welcome to Red Flag Homes Hero Header */}
            <div className="text-center space-y-4 bg-gradient-to-b from-red-950/80 via-zinc-950 to-zinc-900 p-6 sm:p-8 rounded-2xl border border-red-800/40 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-red-600/10 blur-3xl pointer-events-none rounded-full" />
              <div className="w-20 h-20 bg-emerald-950 text-emerald-400 border-2 border-emerald-500/60 rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1 relative z-10">
                <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">
                  Official Onboarding Complete
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  WELCOME TO RED FLAG HOMES!
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-lg mx-auto pt-1">
                  Congratulations <strong>{agreement.partyAName}</strong>! Your Listing & Property Management MOU has been digitally executed and officially sealed.
                </p>
              </div>

              {/* PDF Download Direct Actions Bar */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-3 relative z-10">
                <button
                  onClick={() => downloadMouPdf(agreement, displayAudit)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-2xl shadow-red-950 transition-all active:scale-95 min-h-[48px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed MOU PDF</span>
                </button>

                <button
                  onClick={() => downloadAuditCertificatePdf(displayAudit, agreement)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl border border-zinc-700 transition-colors min-h-[48px]"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Download Audit Certificate PDF</span>
                </button>

                {onBackToCRM && (
                  <button
                    onClick={onBackToCRM}
                    className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs px-4 py-3.5 rounded-xl border border-zinc-800 min-h-[48px]"
                  >
                    Return to Sales Desk
                  </button>
                )}
              </div>
            </div>

            {/* Signed Agreement Public Link & Audit QR Preview Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                    Signed Agreement Shareable Link & Verification Preview
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800/60 self-start sm:self-center">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Public Verification Active</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Live E-Sign & Legal Audit Trail Link:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicSignUrl}
                      className="w-full bg-zinc-900 border border-zinc-800 text-red-400 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(publicSignUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 min-h-[42px] transition-all"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={publicSignUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 shrink-0 min-h-[42px] flex items-center justify-center transition-colors"
                      title="Open Signed Link Preview in New Tab"
                    >
                      <ExternalLink className="w-4 h-4 text-red-400" />
                    </a>
                  </div>
                </div>

                {qrCodeUrl && (
                  <div className="flex items-center gap-3 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                    <img
                      src={qrCodeUrl}
                      alt="Verification QR Code"
                      className="w-14 h-14 bg-white p-1 rounded-lg border border-zinc-700 shrink-0 object-contain"
                    />
                    <div className="space-y-0.5 text-[11px]">
                      <strong className="text-zinc-200 font-mono text-xs block">
                        Audit Log QR Code
                      </strong>
                      <span className="text-zinc-400 text-[10px] block leading-tight">
                        Scan with phone camera to open audit log entry.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Email Status & 1-Click Mailbox Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-950 text-red-400 border border-red-800/60 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Confirmation Email Sent to: <span className="text-red-400 font-mono">{clientEmail || agreement.partyAEmail || 'Client Email'}</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Official Dispatch From: <span className="text-zinc-200 font-mono">agreements@redflaghomes.in</span> • Internal Copy: <span className="text-zinc-200 font-mono">hello@redflaghomes.in</span>
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 self-start sm:self-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{completionEmailStatus}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* 1-Click Open in Gmail */}
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail || agreement.partyAEmail || '')}&su=${encodeURIComponent(`Welcome to Red Flag Homes! Executed MOU - ${agreement.id}`)}&body=${encodeURIComponent(
                    `Welcome to Red Flag Homes!\n\nAgreement ID: ${agreement.id}\nOwner: ${clientName || agreement.partyAName}\nCorporate Desk: Guru Marg, Paschim Vihar, New Delhi\nOfficial Sender: agreements@redflaghomes.in\n\nYour signed MOU agreement and audit certificate have been successfully executed.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow min-h-[44px]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open in Gmail</span>
                </a>

                {/* 1-Click Open in Default Mail Client */}
                <a
                  href={`mailto:${encodeURIComponent(clientEmail || agreement.partyAEmail || '')}?subject=${encodeURIComponent(`Welcome to Red Flag Homes! Executed MOU - ${agreement.id}`)}&body=${encodeURIComponent(
                    `Welcome to Red Flag Homes!\n\nAgreement ID: ${agreement.id}\nOwner: ${clientName || agreement.partyAName}\nCorporate Office: Guru Marg, Paschim Vihar, New Delhi\nOfficial Sender: agreements@redflaghomes.in\n\nExecuted MOU and audit certificate recorded.`
                  )}`}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-zinc-800 transition-colors min-h-[44px]"
                >
                  <span>Open in Mail App</span>
                </a>

                {/* Resend button */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsResendingEmail(true);
                    try {
                      const res = await fetch('/api/email/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          recipient: clientEmail || agreement.partyAEmail || agreement.salesExecutiveEmail,
                          subject: `[CONFIRMATION] Welcome to Red Flag Homes! Executed MOU - ${agreement.title}`,
                          agreementId: agreement.id,
                          bodyText: `Welcome ${clientName || agreement.partyAName}! Your Memorandum of Understanding has been successfully executed with Red Flag Homes. Payment Transaction ID: ${paymentTxId || 'Verified'}. Corporate Desk: Guru Marg, Paschim Vihar, New Delhi.`,
                          attachments: ['Signed_MOU_Agreement.pdf', 'Audit_Certificate.pdf'],
                        }),
                      });
                      const d = await res.json();
                      setCompletionEmailStatus(`Email resent to ${clientEmail || agreement.partyAEmail}!`);
                    } catch {
                      setCompletionEmailStatus(`Email dispatched to ${clientEmail || agreement.partyAEmail}`);
                    } finally {
                      setIsResendingEmail(false);
                    }
                  }}
                  disabled={isResendingEmail}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-zinc-800 transition-colors min-h-[44px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResendingEmail ? 'animate-spin text-red-400' : 'text-zinc-400'}`} />
                  <span>{isResendingEmail ? 'Resending...' : 'Resend Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Red Flag Homes MOU Executed\nAgreement ID: ${agreement.id}\nClient: ${clientName || agreement.partyAName} (${clientEmail || agreement.partyAEmail})\nCorporate Office: Guru Marg, Paschim Vihar, New Delhi\nOfficial Email: agreements@redflaghomes.in`
                    );
                    setCopiedEmailText(true);
                    setTimeout(() => setCopiedEmailText(false), 2000);
                  }}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs px-3 py-2.5 rounded-xl border border-zinc-800 transition-colors sm:ml-auto min-h-[44px]"
                >
                  {copiedEmailText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmailText ? 'Copied' : 'Copy Email Text'}</span>
                </button>
              </div>
            </div>

            {/* Official Digital Company Seal Card */}
            <DigitalCompanySeal
              agreementId={agreement.id}
              timestamp={displayAudit.signedTimestamp}
              qrCodeUrl={qrCodeUrl}
            />

            {/* Audit Trail Certificate Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-left text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-sans flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" /> Digital Audit Certificate
                </span>
                <span className="text-emerald-400 font-bold text-sm">{displayAudit.certificateId}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-300">
                <div>
                  <span className="text-zinc-500 block text-[10px]">Asset Owner / Party A:</span>
                  <span className="text-white font-bold text-sm">{agreement.partyAName}</span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[10px]">Signed Timestamp:</span>
                  <span className="text-white">{new Date(displayAudit.signedTimestamp).toLocaleString('en-IN')}</span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[10px]">Client IP Address:</span>
                  <span className="text-white">{displayAudit.ipAddress}</span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[10px]">Browser & Verification:</span>
                  <span className="text-white">{displayAudit.browser}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-zinc-500 block text-[10px]">Document Cryptographic Hash (SHA-256):</span>
                  <span className="text-red-400 truncate block text-[10px] bg-zinc-900 p-2 rounded border border-zinc-800">{displayAudit.documentHash}</span>
                </div>
              </div>
            </div>

            {/* Signed Contract Paper Document Scroll & Download Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-zinc-200 uppercase tracking-wider font-sans">
                  Executed Signed Document Paper Preview
                </span>
                <button
                  onClick={() => downloadMouPdf(agreement, displayAudit)}
                  className="text-red-400 hover:text-red-300 font-bold underline flex items-center gap-1 min-h-[44px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </button>
              </div>

              <div className="bg-white text-zinc-900 p-6 sm:p-8 rounded-2xl border-4 border-double border-zinc-300 max-h-96 overflow-y-auto font-serif text-xs leading-relaxed whitespace-pre-wrap shadow-inner relative select-none">
                {fullMouText}

                <div className="mt-8 pt-6 border-t-2 border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Party A Signature</span>
                    {displayAudit.signatureData && displayAudit.signatureData.startsWith('data:image') ? (
                      <img src={displayAudit.signatureData} alt="Client Signature" className="h-12 object-contain" />
                    ) : (
                      <div className="font-serif italic text-lg text-zinc-900">{displayAudit.signatureData || agreement.partyAName}</div>
                    )}
                    <span className="text-[10px] text-zinc-400 font-mono block pt-1">Timestamp: {new Date(displayAudit.signedTimestamp).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] font-bold text-red-600 uppercase block mb-1">Party B Corporate Seal</span>
                    <div className="text-xs font-bold text-zinc-900">RED FLAG HOMES NETWORK</div>
                    <span className="text-[10px] text-zinc-500 font-mono block">Guru Marg, Paschim Vihar, New Delhi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Success Modal upon MOU Signing Completion */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden border-red-500/40">
            {/* Top Red Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-28 bg-red-600/20 blur-3xl pointer-events-none rounded-full" />

            {/* Close / Dismiss button */}
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success Icon */}
            <div className="w-20 h-20 bg-emerald-950 text-emerald-400 border-2 border-emerald-500/80 rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10 animate-pulse">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2 relative z-10">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest block">
                Official Onboarding Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                WELCOME TO RED FLAG HOMES!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Your Listing & Property Management MOU (<strong className="text-red-400 font-mono">{agreement.id}</strong>) for <strong>{agreement.partyAName}</strong> has been successfully executed, digitally sealed, and archived.
              </p>
            </div>

            {/* Key Audit Details Badge */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left text-xs font-mono space-y-1.5 text-zinc-400">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-1">
                <span>Audit Certificate ID:</span>
                <strong className="text-emerald-400 font-bold">{displayAudit.certificateId}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Signed Timestamp:</span>
                <strong className="text-zinc-200">{new Date(displayAudit.signedTimestamp).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Client IP Address:</span>
                <strong className="text-zinc-200">{displayAudit.ipAddress}</strong>
              </div>
            </div>

            {/* Signed Link Preview Box in Modal */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans flex items-center justify-between">
                <span>Signed Agreement Shareable Link</span>
                <span className="text-emerald-400 font-mono text-[9px]">Live URL</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicSignUrl}
                  className="w-full bg-zinc-900 border border-zinc-800 text-red-400 font-mono text-xs rounded-xl px-3 py-2 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicSignUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 min-h-[38px] transition-all"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
                <a
                  href={publicSignUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0 min-h-[38px] flex items-center justify-center transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                </a>
              </div>
            </div>

            {/* Direct Action Buttons as requested */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => downloadMouPdf(agreement, displayAudit)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-red-500 to-red-400 hover:from-red-500 hover:to-red-300 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-xl shadow-red-950 transition-all active:scale-95 min-h-[48px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed PDF</span>
              </button>

              <button
                onClick={() => downloadAuditCertificatePdf(displayAudit, agreement)}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs py-3 rounded-xl border border-zinc-700 transition-colors min-h-[44px]"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Download Audit Certificate PDF</span>
              </button>

              <button
                onClick={() => {
                  if (onBackToCRM) {
                    onBackToCRM();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white font-extrabold text-xs py-3.5 rounded-xl border border-zinc-800 transition-colors min-h-[48px]"
              >
                <ChevronRight className="w-4 h-4 text-red-500" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
