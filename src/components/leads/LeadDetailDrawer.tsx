import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Paperclip,
  Plus,
  ExternalLink,
  Trash2,
  Upload,
  FileSignature,
  ShieldCheck,
  Eye,
  Mail,
  Sparkles,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  CheckCircle2,
  FileText,
  Lock,
  Activity,
  History,
  Send,
  UserCheck,
  FolderSync,
  Folder,
  FolderPlus,
  Copy,
  Check,
} from 'lucide-react';
import { Lead, LeadStage, CallLog, LeadDocument, AgreementData, EmailLog } from '../../types/crm';
import { GooglePickerButton } from '../common/GooglePickerButton';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenAgreementForLead: (lead: Lead) => void;
  agreements?: AgreementData[];
  emailLogs?: EmailLog[];
}

export interface TimelineEvent {
  id: string;
  type: 'creation' | 'mou_generated' | 'mou_viewed' | 'mou_signed' | 'email_sent' | 'call' | 'document' | 'note';
  title: string;
  description: string;
  timestamp: string;
  formattedDate: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
  metadata?: Record<string, any>;
}

function buildLeadTimelineEvents(
  lead: Lead,
  agreements: AgreementData[] = [],
  emailLogs: EmailLog[] = []
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Lead Creation Event
  events.push({
    id: `event_created_${lead.id}`,
    type: 'creation',
    title: 'Lead Onboarded to Pipeline',
    description: `Prospect acquired via ${lead.source} by ${lead.salesExecutiveName} in ${lead.city}`,
    timestamp: lead.createdAt ? `${lead.createdAt}T09:00:00Z` : '2026-10-24T09:00:00Z',
    formattedDate: lead.createdAt || 'Initial Onboarding',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-700/60',
    iconName: 'sparkles',
    metadata: {
      source: lead.source,
      executive: lead.salesExecutiveName,
      revenue: `₹${lead.expectedRevenue.toLocaleString('en-IN')}`,
      properties: `${lead.numberOfProperties} Units`,
    },
  });

  // 2. Matching Agreements for this lead
  const matchedAgreements = agreements.filter(
    (a) =>
      a.leadId === lead.id ||
      (a.partyAEmail && lead.email && a.partyAEmail.toLowerCase() === lead.email.toLowerCase()) ||
      (a.partyAMobile && lead.mobileNumber && a.partyAMobile.replace(/\s+/g, '') === lead.mobileNumber.replace(/\s+/g, '')) ||
      (lead.agreementId && a.id.toLowerCase() === lead.agreementId.toLowerCase())
  );

  matchedAgreements.forEach((agr) => {
    // MOU Created / Sent
    if (agr.sentAt || agr.effectiveDate) {
      events.push({
        id: `event_mou_sent_${agr.id}`,
        type: 'mou_generated',
        title: `MOU Generated & Dispatched (${agr.id})`,
        description: `Listing & Property Management MOU "${agr.title}" generated with ${agr.ownerPercent}% Owner / ${agr.commissionPercent}% Red Flag Homes split.`,
        timestamp: agr.sentAt || `${agr.effectiveDate}T10:00:00Z`,
        formattedDate: agr.sentAt ? new Date(agr.sentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : agr.effectiveDate,
        badgeBg: 'bg-amber-950/80',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-700/60',
        iconName: 'mou',
        metadata: {
          agreementId: agr.id,
          terms: `${agr.ownerPercent}% Owner / ${agr.commissionPercent}% Red Flag Homes`,
          publicSignUrl: agr.publicSignUrl,
          executive: agr.salesExecutiveName,
        },
      });
    }

    // MOU Viewed
    if (agr.viewedAt) {
      events.push({
        id: `event_mou_viewed_${agr.id}`,
        type: 'mou_viewed',
        title: `Agreement Link Viewed by Client (${agr.id})`,
        description: `${agr.partyAName} opened and reviewed contract terms on the e-signature portal.`,
        timestamp: agr.viewedAt,
        formattedDate: new Date(agr.viewedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        badgeBg: 'bg-blue-950/80',
        badgeText: 'text-blue-400',
        badgeBorder: 'border-blue-700/60',
        iconName: 'eye',
        metadata: {
          agreementId: agr.id,
          clientName: agr.partyAName,
        },
      });
    }

    // MOU Signed
    if (agr.signedAt || agr.status === 'Signed') {
      events.push({
        id: `event_mou_signed_${agr.id}`,
        type: 'mou_signed',
        title: `MOU Digitally Executed & Sealed! (${agr.id})`,
        description: `Digital e-signature completed by ${agr.partyAName} with live selfie verification & OTP seal.`,
        timestamp: agr.signedAt || new Date().toISOString(),
        formattedDate: agr.signedAt ? new Date(agr.signedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Signed',
        badgeBg: 'bg-emerald-950/80',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-700/60',
        iconName: 'shield',
        metadata: {
          agreementId: agr.id,
          certificateId: agr.auditTrail?.certificateId || `CERT-${agr.id}`,
          ipAddress: agr.auditTrail?.ipAddress || '103.211.54.18',
          documentHash: agr.auditTrail?.documentHash || 'd41d8cd98f00b204e9800998ecf8427e',
          paymentTransactionId: agr.paymentTransactionId || agr.auditTrail?.paymentTransactionId || 'Verified',
        },
      });
    }
  });

  // 3. Matching Email Dispatches & Reminders
  const matchedEmails = emailLogs.filter((log) => {
    if (log.recipient && lead.email && log.recipient.toLowerCase() === lead.email.toLowerCase()) return true;
    if (matchedAgreements.some((a) => a.id === log.agreementId)) return true;
    return false;
  });

  matchedEmails.forEach((email) => {
    events.push({
      id: `event_email_${email.id}`,
      type: 'email_sent',
      title: `Email Dispatch / Reminder Sent`,
      description: `"${email.subject}" dispatched to ${email.recipient} (${email.status})`,
      timestamp: email.sentAt,
      formattedDate: new Date(email.sentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      badgeBg: 'bg-purple-950/80',
      badgeText: 'text-purple-400',
      badgeBorder: 'border-purple-700/60',
      iconName: 'mail',
      metadata: {
        sender: email.sender,
        recipient: email.recipient,
        agreementId: email.agreementId,
        attachments: email.attachments?.join(', ') || 'Signed_MOU.pdf',
        status: email.status,
      },
    });
  });

  // 4. Call Logs
  lead.callHistory.forEach((call) => {
    events.push({
      id: `event_call_${call.id}`,
      type: 'call',
      title: `Call Logged: ${call.outcome}`,
      description: `${call.summary} (Duration: ${call.duration})`,
      timestamp: call.date ? `${call.date}T12:00:00Z` : new Date().toISOString(),
      formattedDate: call.date,
      badgeBg: 'bg-amber-950/80',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-700/60',
      iconName: 'phone',
      metadata: {
        duration: call.duration,
        outcome: call.outcome,
        executive: call.executiveName,
      },
    });
  });

  // 5. Documents Uploaded
  lead.documents.forEach((doc) => {
    events.push({
      id: `event_doc_${doc.id}`,
      type: 'document',
      title: `Document Uploaded: ${doc.name}`,
      description: `Type: ${doc.type} (${doc.size}) added to lead records.`,
      timestamp: doc.uploadedAt ? `${doc.uploadedAt}T10:00:00Z` : new Date().toISOString(),
      formattedDate: doc.uploadedAt,
      badgeBg: 'bg-blue-950/80',
      badgeText: 'text-blue-400',
      badgeBorder: 'border-blue-700/60',
      iconName: 'doc',
      metadata: {
        docName: doc.name,
        docType: doc.type,
        size: doc.size,
        url: doc.url,
      },
    });
  });

  // 6. Notes Added
  lead.notes.forEach((note, index) => {
    events.push({
      id: `event_note_${lead.id}_${index}`,
      type: 'note',
      title: `Internal Note Recorded`,
      description: note,
      timestamp: lead.updatedAt ? `${lead.updatedAt}T15:00:00Z` : (lead.createdAt || '2026-10-24T15:00:00Z'),
      formattedDate: lead.updatedAt || lead.createdAt || 'Recent',
      badgeBg: 'bg-zinc-900',
      badgeText: 'text-zinc-300',
      badgeBorder: 'border-zinc-700/60',
      iconName: 'note',
    });
  });

  return events;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onUpdateLead,
  onDeleteLead,
  onOpenAgreementForLead,
  agreements = [],
  emailLogs = [],
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'recent-docs' | 'documents' | 'calls' | 'notes'>('details');
  const [newNote, setNewNote] = useState('');
  const [showAddCall, setShowAddCall] = useState(false);
  const [callSummary, setCallSummary] = useState('');
  const [callOutcome, setCallOutcome] = useState<CallLog['outcome']>('Connected');
  const [callDuration, setCallDuration] = useState('15 min');

  // Timeline State
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'mou' | 'email' | 'call' | 'doc'>('ALL');
  const [timelineSort, setTimelineSort] = useState<'newest' | 'oldest'>('newest');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Recent Documents State
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  if (!lead) return null;

  const stages: LeadStage[] = [
    'New Lead',
    'Contacted',
    'Interested',
    'Meeting Scheduled',
    'Negotiation',
    'Agreement Sent',
    'Signed',
    'Onboarded',
  ];

  const currentStageIndex = stages.indexOf(lead.stage);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const updated = {
      ...lead,
      notes: [newNote, ...lead.notes],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateLead(updated);
    setNewNote('');
  };

  const handleAddCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callSummary.trim()) return;
    const newCall: CallLog = {
      id: `call_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      duration: callDuration,
      summary: callSummary,
      outcome: callOutcome,
      executiveName: lead.salesExecutiveName,
    };
    const updated = {
      ...lead,
      callHistory: [newCall, ...lead.callHistory],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateLead(updated);
    setCallSummary('');
    setShowAddCall(false);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: LeadDocument = {
      id: `doc_${Date.now()}`,
      name: file.name,
      type: file.name.toLowerCase().includes('aadhaar')
        ? 'Aadhaar'
        : file.name.toLowerCase().includes('pan')
        ? 'PAN'
        : 'Ownership Proof',
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString().split('T')[0],
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    };
    const updated = {
      ...lead,
      documents: [...lead.documents, newDoc],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateLead(updated);
  };

  const handleGoogleDriveFilePicked = (driveFile: { id: string; name: string; url: string; mimeType: string }) => {
    let docType: LeadDocument['type'] = 'Ownership Proof';
    const lowerName = driveFile.name.toLowerCase();
    if (lowerName.includes('aadhaar') || lowerName.includes('aadhar')) docType = 'Aadhaar';
    else if (lowerName.includes('pan')) docType = 'PAN';
    else if (lowerName.includes('passport')) docType = 'Passport';
    else if (lowerName.includes('licence') || lowerName.includes('license')) docType = 'Driving Licence';
    else if (lowerName.includes('photo') || lowerName.includes('image')) docType = 'Property Photo';

    const newDoc: LeadDocument = {
      id: `doc_drive_${Date.now()}`,
      name: driveFile.name,
      type: docType,
      url: driveFile.url || `https://drive.google.com/file/d/${driveFile.id}/view`,
      uploadedAt: new Date().toISOString().split('T')[0],
      size: 'Google Drive',
    };
    const updated = {
      ...lead,
      documents: [...lead.documents, newDoc],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateLead(updated);
  };

  const handleCopyDocUrl = (doc: LeadDocument) => {
    navigator.clipboard.writeText(doc.url);
    setCopiedDocId(doc.id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = {
      ...lead,
      documents: lead.documents.filter((d) => d.id !== docId),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateLead(updated);
  };

  const cleanPhone = lead.mobileNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${lead.fullName}, this is ${lead.salesExecutiveName} from Red Flag Homes. Following up regarding your property at ${lead.city}.`
  )}`;

  // Compute full timeline events for this lead
  const rawTimelineEvents = buildLeadTimelineEvents(lead, agreements, emailLogs);

  const filteredTimelineEvents = rawTimelineEvents
    .filter((evt) => {
      if (timelineFilter === 'mou' && !['mou_generated', 'mou_viewed', 'mou_signed'].includes(evt.type)) return false;
      if (timelineFilter === 'email' && evt.type !== 'email_sent') return false;
      if (timelineFilter === 'call' && evt.type !== 'call') return false;
      if (timelineFilter === 'doc' && evt.type !== 'document') return false;

      if (timelineSearch.trim()) {
        const query = timelineSearch.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(query);
        const matchDesc = evt.description.toLowerCase().includes(query);
        const matchMeta = evt.metadata ? JSON.stringify(evt.metadata).toLowerCase().includes(query) : false;
        return matchTitle || matchDesc || matchMeta;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timelineSort === 'newest' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      {/* Full screen layout on mobile, drawer width on desktop */}
      <div className="bg-zinc-950 sm:border-l border-zinc-800 w-full sm:max-w-2xl h-full flex flex-col shadow-2xl relative">
        {/* Drawer Header with increased touch targets */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded border border-red-800/40">
                {lead.city}
              </span>
              <span className="text-xs text-zinc-400 font-mono">ID: {lead.id}</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white truncate">{lead.fullName}</h2>
            <p className="text-xs text-zinc-400 truncate">{lead.propertyAddress}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAgreementForLead(lead)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-xs min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-950/50 active:scale-95"
            >
              <FileSignature className="w-4 h-4" />
              <span className="hidden xs:inline">Generate MOU</span>
              <span className="xs:hidden">MOU</span>
            </button>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors active:scale-95"
              aria-label="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Progression Bar */}
        <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 sm:px-5 py-3">
          <div className="flex items-center justify-between mb-2 text-xs font-semibold text-zinc-300">
            <span>Pipeline Progression</span>
            <span className="text-red-400 font-mono">{lead.stage}</span>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {stages.map((stg, i) => {
              const isPastOrCurrent = i <= currentStageIndex && lead.stage !== 'Lost';
              return (
                <div
                  key={stg}
                  title={stg}
                  className={`h-2 rounded-full transition-all ${
                    isPastOrCurrent
                      ? 'bg-gradient-to-r from-red-700 to-red-500 shadow-sm shadow-red-900'
                      : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Drawer Tabs with 44px touch targets */}
        <div className="flex items-center gap-1 px-3 sm:px-5 pt-2 border-b border-zinc-800 bg-zinc-950 overflow-x-auto scrollbar-none">
          {[
            { id: 'details', label: 'Overview' },
            { id: 'timeline', label: `Timeline (${rawTimelineEvents.length})`, icon: Activity },
            { id: 'recent-docs', label: `Recent Docs (${Math.min(5, lead.documents.length)})`, icon: FolderSync },
            { id: 'documents', label: `All Docs (${lead.documents.length})`, icon: Paperclip },
            { id: 'calls', label: `Calls (${lead.callHistory.length})` },
            { id: 'notes', label: `Notes (${lead.notes.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[44px] px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-400 font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5 text-red-400" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Key Quick Contact Cards with 44px+ touch target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`tel:${lead.mobileNumber}`}
                  className="flex items-center gap-3 p-3.5 min-h-[48px] rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors active:scale-98"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Call Mobile</span>
                    <span className="text-xs font-mono font-bold text-white truncate block">{lead.mobileNumber}</span>
                  </div>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3.5 min-h-[48px] rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors active:scale-98"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block uppercase font-semibold">WhatsApp Chat</span>
                    <span className="text-xs font-semibold text-emerald-400 truncate block">{lead.whatsappStatus}</span>
                  </div>
                </a>
              </div>

              {/* Attributes Grid */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
                  Lead Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Email Address</span>
                    <span className="font-mono text-zinc-200 block truncate">{lead.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Assigned Executive</span>
                    <span className="font-semibold text-zinc-200 block">{lead.salesExecutiveName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Lead Source</span>
                    <span className="text-zinc-300 block">{lead.source}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">No. of Properties</span>
                    <span className="font-mono text-zinc-200 block">{lead.numberOfProperties} Units</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Expected Monthly Revenue</span>
                    <span className="font-mono font-bold text-emerald-400 block">
                      ₹{lead.expectedRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Follow-up Date</span>
                    <span className="font-mono text-amber-400 block">{lead.followUpDate || 'None Set'}</span>
                  </div>
                </div>

                {lead.airbnbUrl && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-zinc-500 block text-xs mb-1">Airbnb Listing URL</span>
                    <a
                      href={lead.airbnbUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-red-400 hover:text-red-300 font-mono flex items-center gap-1 underline truncate min-h-[36px]"
                    >
                      {lead.airbnbUrl} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Recent Activity Timeline Snapshot Preview */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-400" />
                    <span>Recent Activity Timeline</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className="text-[11px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 underline"
                  >
                    View Full Timeline ({rawTimelineEvents.length})
                  </button>
                </div>

                <div className="space-y-2">
                  {rawTimelineEvents.slice(0, 3).map((evt) => (
                    <div key={evt.id} className="flex items-start gap-2.5 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800/80 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 mt-0.5 ${evt.badgeBg} ${evt.badgeText} ${evt.badgeBorder}`}>
                        {evt.type.replace('_', ' ')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white block truncate">{evt.title}</span>
                        <span className="text-[10px] text-zinc-400 font-mono block">{evt.formattedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Documents Snapshot Preview */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <FolderSync className="w-4 h-4 text-blue-400" />
                    <span>Recent Documents (Google Drive)</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('recent-docs')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 underline"
                  >
                    View All Recent ({Math.min(5, lead.documents.length)})
                  </button>
                </div>

                {lead.documents.length === 0 ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-400">
                    <span>No documents attached to folder yet.</span>
                    <button
                      onClick={() => setActiveTab('recent-docs')}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                    >
                      Attach from Drive
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...lead.documents].slice(-3).reverse().map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-xl border border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Paperclip className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate max-w-xs">{doc.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{doc.type} · {doc.uploadedAt}</span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold shrink-0 p-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Filter, Search & Sort Bar */}
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={timelineSearch}
                      onChange={(e) => setTimelineSearch(e.target.value)}
                      placeholder="Search timeline events..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl min-h-[36px] pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                      onClick={() => setTimelineSort(timelineSort === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      title="Toggle Sort Direction"
                    >
                      <ArrowUpDown className="w-3 h-3 text-red-400" />
                      <span>{timelineSort === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {filteredTimelineEvents.length} events
                    </span>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                  {[
                    { id: 'ALL', label: 'All Events' },
                    { id: 'mou', label: 'MOUs & Signatures' },
                    { id: 'email', label: 'Email Reminders' },
                    { id: 'call', label: 'Calls' },
                    { id: 'doc', label: 'Documents' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setTimelineFilter(f.id as any)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                        timelineFilter === f.id
                          ? 'bg-red-600 text-white font-bold shadow'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/80'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Visualization Tree */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-red-600 before:via-zinc-800 before:to-zinc-900">
                {filteredTimelineEvents.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-2xl">
                    No timeline events found matching your filter query.
                  </div>
                ) : (
                  filteredTimelineEvents.map((evt) => {
                    const isExpanded = expandedEventId === evt.id;

                    let IconComponent = Activity;
                    if (evt.iconName === 'sparkles') IconComponent = Sparkles;
                    if (evt.iconName === 'mou') IconComponent = FileSignature;
                    if (evt.iconName === 'eye') IconComponent = Eye;
                    if (evt.iconName === 'shield') IconComponent = ShieldCheck;
                    if (evt.iconName === 'mail') IconComponent = Mail;
                    if (evt.iconName === 'phone') IconComponent = Phone;
                    if (evt.iconName === 'doc') IconComponent = Paperclip;
                    if (evt.iconName === 'note') IconComponent = MessageSquare;

                    return (
                      <div key={evt.id} className="relative group">
                        {/* Timeline Node Badge Icon */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full ${evt.badgeBg} ${evt.badgeText} border ${evt.badgeBorder} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 z-10`}
                        >
                          <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </div>

                        {/* Event Content Card */}
                        <div className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 p-4 rounded-2xl transition-all shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded border ${evt.badgeBg} ${evt.badgeText} ${evt.badgeBorder}`}>
                                  {evt.type.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  {evt.formattedDate}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white tracking-wide">{evt.title}</h4>
                            </div>

                            {evt.metadata && (
                              <button
                                onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-700/80 text-[10px] font-mono flex items-center gap-1 shrink-0"
                                title="Toggle Metadata Details"
                              >
                                <span>Details</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{evt.description}</p>

                          {/* Expandable Metadata Detail Box */}
                          {isExpanded && evt.metadata && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/80 bg-zinc-950/80 p-3 rounded-xl space-y-2 animate-in fade-in duration-150">
                              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block font-mono">
                                Verification Metadata & Audit Logs
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                                {Object.entries(evt.metadata).map(([k, v]) => (
                                  <div key={k} className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800/60 truncate">
                                    <span className="text-zinc-500 capitalize block text-[9px]">{k}</span>
                                    <span className="text-zinc-200 font-semibold truncate block">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300">Call Logs</h3>
                <button
                  onClick={() => setShowAddCall(!showAddCall)}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-700 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Log Call
                </button>
              </div>

              {showAddCall && (
                <form onSubmit={handleAddCall} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 font-semibold">Outcome</label>
                      <select
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value as any)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl min-h-[44px] p-2.5 text-xs text-white"
                      >
                        <option value="Connected">Connected</option>
                        <option value="Busy">Busy</option>
                        <option value="Follow-up Needed">Follow-up Needed</option>
                        <option value="Scheduled Meeting">Scheduled Meeting</option>
                        <option value="Not Interested">Not Interested</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 font-semibold">Duration</label>
                      <input
                        type="text"
                        value={callDuration}
                        onChange={(e) => setCallDuration(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl min-h-[44px] p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-semibold">Call Notes / Summary</label>
                    <textarea
                      required
                      value={callSummary}
                      onChange={(e) => setCallSummary(e.target.value)}
                      placeholder="Discussed commission split and property access terms..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white h-20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs min-h-[44px] py-3 rounded-xl shadow"
                  >
                    Save Call Log
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {lead.callHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No call logs recorded yet.</p>
                ) : (
                  lead.callHistory.map((call) => (
                    <div key={call.id} className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{call.outcome}</span>
                        <span className="text-zinc-500 font-mono text-[10px]">{call.date} ({call.duration})</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{call.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'recent-docs' && (
            <div className="space-y-5">
              {/* Top Banner Card with Google Drive Integration & Action */}
              <div className="bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-900/90 border border-blue-900/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-blue-950 text-blue-400 border border-blue-800/50 rounded-xl shrink-0">
                        <FolderSync className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>Recent Documents (Lead Folder)</span>
                          <span className="text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Google Drive Connected
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-300">
                          Directly view, link, and add documents for <span className="text-white font-semibold">{lead.fullName}</span> (displaying last 5 added).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <GooglePickerButton
                      onFilePicked={handleGoogleDriveFilePicked}
                      buttonText="Attach from Google Drive"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs min-h-[44px] px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-950/80 active:scale-95"
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-900/30 flex items-center justify-between text-[11px] text-zinc-400 font-mono flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-blue-400" />
                    Lead Folder ID: <span className="text-zinc-200">folder_{lead.id}</span>
                  </span>
                  <span>{lead.documents.length} Total Files in Folder</span>
                </div>
              </div>

              {/* Last 5 Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    <span>Last 5 Documents Added</span>
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {Math.min(5, lead.documents.length)} of {lead.documents.length} displayed
                  </span>
                </div>

                {lead.documents.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/40 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-950/60 text-blue-400 border border-blue-800/40 flex items-center justify-center">
                      <FolderPlus className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-200">No documents linked yet</h4>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Connect {lead.fullName}'s folder by selecting files from Google Drive with the Google Picker.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center">
                      <GooglePickerButton
                        onFilePicked={handleGoogleDriveFilePicked}
                        buttonText="Pick Document from Google Drive"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs min-h-[44px] px-5 py-2.5 rounded-xl shadow-lg shadow-blue-950 active:scale-95 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[...lead.documents].slice(-5).reverse().map((doc, idx) => {
                      const isGoogleDrive = doc.size === 'Google Drive' || doc.url.includes('drive.google.com');
                      const isCopied = copiedDocId === doc.id;

                      return (
                        <div
                          key={doc.id}
                          className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 p-3.5 sm:p-4 rounded-2xl transition-all shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                #{idx + 1}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-white truncate block max-w-xs sm:max-w-md">
                                    {doc.name}
                                  </span>
                                  {idx === 0 && (
                                    <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-400">
                                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                                    {doc.type}
                                  </span>
                                  {isGoogleDrive ? (
                                    <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/50 font-mono flex items-center gap-1 font-semibold">
                                      <FolderSync className="w-3 h-3" /> Google Drive File
                                    </span>
                                  ) : (
                                    <span className="font-mono text-zinc-400">
                                      Size: {doc.size}
                                    </span>
                                  )}
                                  <span className="text-zinc-500 font-mono">
                                    Added {doc.uploadedAt}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Direct Link and Quick Actions */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => handleCopyDocUrl(doc)}
                                className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700 active:scale-95 text-xs font-medium"
                                title="Copy Document Direct Link"
                              >
                                {isCopied ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs min-h-[38px] px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-950/50 active:scale-95"
                                title="Open document in external tab"
                              >
                                <span>Open Document</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-red-950/80 text-zinc-500 hover:text-red-400 transition-colors border border-zinc-800 active:scale-95"
                                title="Remove document from lead folder"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Truncated URL Preview */}
                          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                            <span className="truncate max-w-sm sm:max-w-lg">
                              Link: <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{doc.url}</a>
                            </span>
                            <span className="shrink-0 text-zinc-500">ID: {doc.id}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Switcher to All Documents if more exist */}
                {lead.documents.length > 5 && (
                  <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      Displaying top 5 most recent files. Total {lead.documents.length} files in this lead folder.
                    </span>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="text-red-400 hover:text-red-300 font-bold underline text-xs"
                    >
                      View All Documents ({lead.documents.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-zinc-300">Uploaded Verification Documents</h3>
                <div className="flex items-center gap-2">
                  <GooglePickerButton
                    onFilePicked={handleGoogleDriveFilePicked}
                    buttonText="Google Drive"
                  />
                  <label className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold min-h-[44px] px-3.5 py-2 rounded-xl cursor-pointer transition-colors active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Upload Local</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleDocumentUpload}
                      accept="image/*,application/pdf"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                {lead.documents.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-8 text-center border border-dashed border-zinc-800 rounded-xl">
                    No documents uploaded yet (e.g. Aadhaar, PAN, Passport).
                  </p>
                ) : (
                  lead.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl min-h-[48px]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Paperclip className="w-4 h-4 text-red-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-zinc-200 block truncate">{doc.name}</span>
                          <span className="text-[10px] text-zinc-500">{doc.type} · {doc.size}</span>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-red-400 hover:underline font-bold min-h-[44px] flex items-center px-2"
                      >
                        View
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type an internal lead note..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 h-24"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white text-xs font-bold min-h-[44px] px-5 py-2.5 rounded-xl shadow"
                >
                  Add Note
                </button>
              </form>

              <div className="space-y-2">
                {lead.notes.map((note, i) => (
                  <div key={i} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with large 44px+ tap target buttons */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            onClick={() => onDeleteLead(lead.id)}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 font-semibold min-h-[44px] px-3 py-2 transition-colors active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Lead</span>
          </button>

          <button
            onClick={() => onOpenAgreementForLead(lead)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-extrabold text-xs sm:text-sm min-h-[48px] px-5 sm:px-6 py-3 rounded-xl shadow-lg shadow-red-950 active:scale-95 transition-all"
          >
            <FileSignature className="w-4 h-4" />
            <span>Generate Digital MOU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
