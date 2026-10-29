import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  Download,
  FileText,
  User,
  CreditCard,
  Camera,
  Award,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Copy,
  Check,
  MapPin,
  Compass,
  Laptop,
} from 'lucide-react';
import { AgreementData, AuditTrail, AgreementStatus } from '../../types/crm';
import { downloadAuditCertificatePdf, downloadMouPdf } from '../../utils/pdfGenerator';
import { DigitalCompanySeal, DocumentAuditStamp } from '../common/RedFlagLogo';

interface AuditLogsViewProps {
  agreements: AgreementData[];
  onSelectAgreement?: (agreement: AgreementData) => void;
  onOpenSigningPortal?: (agreement: AgreementData) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  agreements,
  onSelectAgreement,
  onOpenSigningPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAuditModal, setSelectedAuditModal] = useState<{
    agreement: AgreementData;
    audit: AuditTrail;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Filter agreements based on search query and status
  const filteredAgreements = agreements.filter((agr) => {
    const matchesSearch =
      agr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agr.partyAName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agr.partyAEmail && agr.partyAEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (agr.auditTrail?.ipAddress && agr.auditTrail.ipAddress.includes(searchQuery)) ||
      (agr.auditTrail?.certificateId && agr.auditTrail.certificateId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'SIGNED' && agr.status === 'Signed') ||
      (selectedStatus === 'VIEWED' && (agr.status === 'Viewed' || agr.status === 'Selfie Verified' || agr.status === 'Payment Submitted')) ||
      (selectedStatus === 'INACTIVE' && (agr.status === 'Inactive' || agr.status === 'Draft' || agr.status === 'Agreement Sent'));

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics
  const totalAgreements = agreements.length;
  const signedAgreementsCount = agreements.filter((a) => a.status === 'Signed').length;
  const viewedAgreementsCount = agreements.filter(
    (a) => a.status === 'Viewed' || a.status === 'Selfie Verified' || a.status === 'Payment Submitted' || a.status === 'Signed'
  ).length;
  const pendingActionCount = totalAgreements - signedAgreementsCount;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'Signed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Signed & Executed</span>
          </span>
        );
      case 'Payment Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <CreditCard className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Fee Paid • Awaiting Sign</span>
          </span>
        );
      case 'Selfie Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-950/80 text-blue-300 border border-blue-800/80">
            <Camera className="w-3 h-3 text-blue-400 shrink-0" />
            <span>Selfie Verified</span>
          </span>
        );
      case 'Viewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
            <Eye className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>Viewed by Client</span>
          </span>
        );
      case 'Agreement Sent':
      case 'Awaiting Signature':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-zinc-900 text-zinc-300 border border-zinc-700">
            <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>Link Dispatched</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-zinc-950 text-zinc-500 border border-zinc-800">
            <span>Inactive / Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Client Audit Logs & Interaction History
              </h1>
              <p className="text-xs text-zinc-400">
                Live verification records (Viewed, Signed, Verification Timestamps, IP Addresses) pulled directly from agreement status state.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800 text-zinc-300">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Compliance: Indian IT Act Digital E-Sign Audit Trail</span>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Total Agreements
          </span>
          <div className="text-2xl font-black text-white font-mono">{totalAgreements}</div>
          <p className="text-[10px] text-zinc-500">Tracked in CRM Desk</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
            Viewed Interactions
          </span>
          <div className="text-2xl font-black text-indigo-300 font-mono">{viewedAgreementsCount}</div>
          <p className="text-[10px] text-zinc-500">Opened by Client</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
            Signed & Executed
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{signedAgreementsCount}</div>
          <p className="text-[10px] text-zinc-500">Full Audit Certificate Active</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
            Pending Execution
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono">{pendingActionCount}</div>
          <p className="text-[10px] text-zinc-500">Awaiting E-Signature</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Agreement ID, Client Name, Email or IP Address..."
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${
              selectedStatus === 'ALL'
                ? 'bg-red-600 text-white shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            All Logs ({agreements.length})
          </button>

          <button
            onClick={() => setSelectedStatus('SIGNED')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${
              selectedStatus === 'SIGNED'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Signed ({signedAgreementsCount})
          </button>

          <button
            onClick={() => setSelectedStatus('VIEWED')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${
              selectedStatus === 'VIEWED'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Viewed / In Progress ({viewedAgreementsCount - signedAgreementsCount})
          </button>

          <button
            onClick={() => setSelectedStatus('INACTIVE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[40px] ${
              selectedStatus === 'INACTIVE'
                ? 'bg-zinc-800 text-white shadow'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Inactive / Draft
          </button>
        </div>
      </div>

      {/* Main Detailed Audit Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="p-4">Agreement & Client</th>
                <th className="p-4">Status / Interaction</th>
                <th className="p-4">Verification Timestamps</th>
                <th className="p-4">Client IP & Device</th>
                <th className="p-4">Audit Certificate & Data</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-xs">
              {filteredAgreements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    <ShieldCheck className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                    <p className="font-semibold">No agreement audit logs found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredAgreements.map((agr) => {
                  const audit = agr.auditTrail;
                  const viewedTime = agr.viewedAt || agr.sentAt;
                  const signedTime = agr.signedAt || audit?.signedTimestamp;

                  return (
                    <tr
                      key={agr.id}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (onSelectAgreement) {
                          onSelectAgreement(agr);
                        }
                      }}
                    >
                      {/* Agreement & Client */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-800/50">
                              {agr.id}
                            </span>
                          </div>
                          <strong className="text-white font-bold block text-sm group-hover:text-red-400 transition-colors">
                            {agr.partyAName}
                          </strong>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {agr.partyAEmail || 'No Email Registered'}
                          </div>
                          {agr.partyAMobile && (
                            <div className="text-[10px] text-zinc-500 font-mono">
                              📱 {agr.partyAMobile}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status / Interaction */}
                      <td className="p-4 align-top space-y-2">
                        <div>{getStatusBadge(agr.status)}</div>

                        {/* Visual Step Progression Checklist */}
                        <div className="space-y-1 text-[10px] font-mono text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agr.status !== 'Inactive' && agr.status !== 'Draft'
                                  ? 'bg-emerald-400'
                                  : 'bg-zinc-700'
                              }`}
                            />
                            <span>1. Opened / Viewed</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agr.clientSelfieUrl || agr.status === 'Selfie Verified' || agr.status === 'Payment Submitted' || agr.status === 'Signed'
                                  ? 'bg-emerald-400'
                                  : 'bg-zinc-700'
                              }`}
                            />
                            <span>2. Live Selfie Captured</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agr.paymentTransactionId || agr.status === 'Payment Submitted' || agr.status === 'Signed'
                                  ? 'bg-emerald-400'
                                  : 'bg-zinc-700'
                              }`}
                            />
                            <span>3. Fee Payment Uploaded</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agr.status === 'Signed' ? 'bg-emerald-400' : 'bg-zinc-700'
                              }`}
                            />
                            <span>4. E-Signature Executed</span>
                          </div>
                        </div>
                      </td>

                      {/* Verification Timestamps */}
                      <td className="p-4 align-top space-y-2 font-mono text-[11px]">
                        <div>
                          <span className="text-zinc-500 block text-[10px]">Document Created:</span>
                          <span className="text-zinc-300">
                            {new Date(agr.effectiveDate || Date.now()).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        {viewedTime && (
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Client Interaction (Viewed):</span>
                            <span className="text-indigo-300 font-bold">
                              {new Date(viewedTime).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {signedTime ? (
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Signed & Verified:</span>
                            <span className="text-emerald-400 font-bold">
                              {new Date(signedTime).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-400/80 text-[10px] block italic font-sans">
                            ⌛ Pending E-Signature
                          </span>
                        )}
                      </td>

                      {/* Client IP, Device, User-Agent & Geolocation */}
                      <td className="p-4 align-top space-y-1.5 font-mono text-[11px]">
                        {audit ? (
                          <>
                            <div>
                              <span className="text-zinc-500 block text-[10px]">IP Address:</span>
                              <strong className="text-white bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                {audit.ipAddress}
                              </strong>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px]">Device / OS:</span>
                              <span className="text-zinc-300 truncate max-w-[150px] block">
                                {audit.device || 'Desktop / Mobile'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px]">Browser:</span>
                              <span className="text-zinc-400 truncate max-w-[150px] block">
                                {audit.browser || 'Web Browser'}
                              </span>
                            </div>
                            {audit.gpsCoordinates && (
                              <div className="pt-1 border-t border-zinc-800/80">
                                <span className="text-zinc-500 block text-[10px]">Approx Geolocation:</span>
                                <a
                                  href={`https://maps.google.com/?q=${audit.gpsCoordinates.latitude},${audit.gpsCoordinates.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 shadow-sm mt-0.5"
                                  title="Open Signatory Geolocation on Google Maps"
                                >
                                  <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate max-w-[110px]">
                                    {audit.locationName || `${audit.gpsCoordinates.city || 'Delhi NCR'}, India`}
                                  </span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-zinc-500 text-[10px] italic">
                            IP address & fingerprint recorded upon client interaction.
                          </div>
                        )}
                      </td>

                      {/* Audit Certificate & Data */}
                      <td className="p-4 align-top space-y-2 font-mono">
                        {audit ? (
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <strong className="text-emerald-400 font-bold">
                                {audit.certificateId}
                              </strong>
                            </div>

                            {agr.paymentTransactionId && (
                              <div className="text-[10px] text-zinc-300">
                                <span className="text-zinc-500">UTR: </span>
                                <span className="font-bold text-amber-300">
                                  {agr.paymentTransactionId}
                                </span>
                              </div>
                            )}

                            {audit.documentHash && (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-zinc-500 truncate max-w-[110px]">
                                  {audit.documentHash.slice(0, 16)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(audit.documentHash, agr.id);
                                  }}
                                  className="text-zinc-400 hover:text-white p-1"
                                  title="Copy full SHA-256 Hash"
                                >
                                  {copiedHash === agr.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500 italic">
                            Digital audit certificate generated upon completion.
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end gap-1.5">
                          {audit && (
                            <button
                              type="button"
                              onClick={() => setSelectedAuditModal({ agreement: agr, audit })}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors min-h-[36px]"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Audit Details</span>
                            </button>
                          )}

                          {agr.status === 'Signed' && audit && (
                            <button
                              type="button"
                              onClick={() => downloadMouPdf(agr, audit)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors min-h-[36px]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Signed MOU PDF</span>
                            </button>
                          )}

                          {onOpenSigningPortal && (
                            <button
                              type="button"
                              onClick={() => onOpenSigningPortal(agr)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[11px] font-semibold flex items-center gap-1 transition-colors min-h-[36px]"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                              <span>Open Sign Link</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Audit Certificate Modal */}
      {selectedAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedAuditModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="p-3 bg-red-600/20 text-red-500 rounded-2xl border border-red-500/30">
                <Award className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  Official Digital Identity Audit Record
                </span>
                <h3 className="text-lg font-black text-white">
                  Audit Certificate #{selectedAuditModal.audit.certificateId}
                </h3>
              </div>
            </div>

            {/* Live Selfie & Signature Display */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Verified Selfie Photo
                </span>
                {selectedAuditModal.agreement.clientSelfieUrl ? (
                  <img
                    src={selectedAuditModal.agreement.clientSelfieUrl}
                    alt="Selfie Photo"
                    className="w-24 h-24 object-cover rounded-xl border-2 border-emerald-500 mx-auto shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600 text-xs">
                    No Photo
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Hand Signature Record
                </span>
                <div className="w-full h-24 bg-white rounded-xl border border-zinc-300 flex items-center justify-center p-2">
                  {selectedAuditModal.audit.signatureData &&
                  selectedAuditModal.audit.signatureData.startsWith('data:image') ? (
                    <img
                      src={selectedAuditModal.audit.signatureData}
                      alt="Signature"
                      className="max-h-16 object-contain"
                    />
                  ) : (
                    <span className="font-serif italic text-lg text-zinc-900">
                      {selectedAuditModal.audit.signatureData || selectedAuditModal.agreement.partyAName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Complete Data Breakdown */}
            <div className="space-y-2.5 text-xs font-mono bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Agreement ID:</span>
                <strong className="text-red-400">{selectedAuditModal.agreement.id}</strong>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Property Owner (Party A):</span>
                <strong className="text-white">{selectedAuditModal.agreement.partyAName}</strong>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Signed Timestamp:</span>
                <strong className="text-emerald-400">
                  {new Date(selectedAuditModal.audit.signedTimestamp).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Client IP Address:</span>
                <strong className="text-white">{selectedAuditModal.audit.ipAddress}</strong>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Browser & OS:</span>
                <strong className="text-zinc-200">
                  {selectedAuditModal.audit.browser} • {selectedAuditModal.audit.device}
                </strong>
              </div>

              {/* Approximate Geolocation & Coordinates */}
              <div className="border-b border-zinc-900 pb-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Approximate Geolocation:</span>
                  </span>
                  <strong className="text-emerald-400">
                    {selectedAuditModal.audit.locationName ||
                      (selectedAuditModal.audit.gpsCoordinates?.city
                        ? `${selectedAuditModal.audit.gpsCoordinates.city}, ${selectedAuditModal.audit.gpsCoordinates.region || 'Delhi NCR'}, India`
                        : 'New Delhi, India')}
                  </strong>
                </div>

                {selectedAuditModal.audit.gpsCoordinates && (
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                    <div>
                      <span>Coordinates: </span>
                      <strong className="text-zinc-200">
                        {selectedAuditModal.audit.gpsCoordinates.latitude.toFixed(4)}, {selectedAuditModal.audit.gpsCoordinates.longitude.toFixed(4)}
                      </strong>
                      <span className="text-zinc-500 ml-1">
                        (±{selectedAuditModal.audit.gpsCoordinates.accuracy || 12}m radius)
                      </span>
                    </div>

                    <a
                      href={`https://maps.google.com/?q=${selectedAuditModal.audit.gpsCoordinates.latitude},${selectedAuditModal.audit.gpsCoordinates.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 font-bold text-[10px] flex items-center gap-1 border border-emerald-800/60 transition-colors shrink-0"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Payment Transaction ID / UTR:</span>
                <strong className="text-amber-300">
                  {selectedAuditModal.agreement.paymentTransactionId || 'Verified'}
                </strong>
              </div>

              {/* Raw User-Agent String */}
              <div className="space-y-1 pt-1">
                <span className="text-zinc-500 block text-[10px]">Signatory Browser User-Agent Fingerprint:</span>
                <span className="text-zinc-300 text-[10px] bg-zinc-900 p-2 rounded border border-zinc-800 block break-all font-mono leading-relaxed select-all">
                  {selectedAuditModal.audit.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')}
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-zinc-500 block text-[10px]">SHA-256 Cryptographic Hash:</span>
                <span className="text-red-400 text-[10px] bg-zinc-900 p-2 rounded border border-zinc-800 block break-all">
                  {selectedAuditModal.audit.documentHash}
                </span>
              </div>
            </div>

            {/* Official Digital Seal */}
            <DigitalCompanySeal
              agreementId={selectedAuditModal.agreement.id}
              timestamp={selectedAuditModal.audit.signedTimestamp}
            />

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => downloadAuditCertificatePdf(selectedAuditModal.audit, selectedAuditModal.agreement)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Audit PDF</span>
              </button>

              <button
                type="button"
                onClick={() => downloadMouPdf(selectedAuditModal.agreement, selectedAuditModal.audit)}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed MOU PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
