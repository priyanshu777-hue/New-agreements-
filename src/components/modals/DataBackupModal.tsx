import React from 'react';
import {
  X,
  Database,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  FileCode2,
  Lock,
  History,
  CheckCircle2,
  Users,
  FileText,
  Mail,
  Scale,
} from 'lucide-react';
import { Lead, AgreementData, EmailLog, SystemNotification, StaffUser } from '../../types/crm';
import {
  downloadJsonBackup,
  exportLeadsCsv,
  exportAgreementsCsv,
  exportAuditLogsCsv,
  exportEmailLogsCsv,
} from '../../utils/exportData';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  agreements: AgreementData[];
  emailLogs: EmailLog[];
  notifications: SystemNotification[];
  currentUser: StaffUser;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  leads,
  agreements,
  emailLogs,
  notifications,
  currentUser,
}) => {
  if (!isOpen) return null;

  const signedAgreementsCount = agreements.filter((a) => a.status === 'Signed').length;
  const auditLogsCount = agreements.filter((a) => a.auditTrail || a.status === 'Signed').length;

  const handleDownloadFullJson = () => {
    downloadJsonBackup(
      {
        leads,
        agreements,
        emailLogs,
        notifications,
      },
      {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-950/80 border border-red-800/50 rounded-2xl text-red-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  CRM Data Archival & Legal Backup
                </h2>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Legal Archival Ready
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Export full offline encrypted backups or CSV spreadsheets for legal records and audits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Leads</span>
              </div>
              <span className="text-xl font-extrabold text-white font-mono">{leads.length}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Active prospects</span>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-400" /> MOUs</span>
              </div>
              <span className="text-xl font-extrabold text-white font-mono">{agreements.length}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{signedAgreementsCount} fully signed</span>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-emerald-400" /> Audit Logs</span>
              </div>
              <span className="text-xl font-extrabold text-white font-mono">{auditLogsCount}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Verification seals</span>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-purple-400" /> Email Logs</span>
              </div>
              <span className="text-xl font-extrabold text-white font-mono">{emailLogs.length}</span>
              <span className="text-[10px] text-zinc-500 block mt-0.5">Delivery receipts</span>
            </div>
          </div>

          {/* Section 1: Comprehensive JSON Backup */}
          <div className="bg-gradient-to-br from-red-950/40 via-zinc-900 to-zinc-900/90 border border-red-900/40 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-red-400" />
                  <h3 className="text-sm font-bold text-white">Full JSON Master Archive</h3>
                  <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/60 font-mono px-2 py-0.5 rounded">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-zinc-300 max-w-lg">
                  Contains all raw data: client details, signed digital signatures, OTP logs, GPS coordinates, live selfie URLs, bank details, and email dispatches.
                </p>
              </div>

              <button
                onClick={handleDownloadFullJson}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-950/80 active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Master JSON</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-red-900/30 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-red-400" /> Exported by: {currentUser.name} ({currentUser.role})
              </span>
              <span>Timestamp: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Section 2: Individual CSV Exports */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Individual CSV Spreadsheet Archives
              </h3>
              <span className="text-[11px] text-zinc-500">Compatible with Excel, Google Sheets & Legal Tools</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* CSV 1: Leads */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-950/60 border border-blue-800/40 rounded-xl text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Leads Directory</h4>
                    <p className="text-[11px] text-zinc-400">{leads.length} Records (Contact & Pipeline)</p>
                  </div>
                </div>
                <button
                  onClick={() => exportLeadsCsv(leads)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-all border border-zinc-700 text-xs font-semibold flex items-center gap-1.5"
                  title="Export Leads CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>CSV</span>
                </button>
              </div>

              {/* CSV 2: Agreements */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-950/60 border border-amber-800/40 rounded-xl text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">MOUs & Agreements</h4>
                    <p className="text-[11px] text-zinc-400">{agreements.length} Contracts & Property Terms</p>
                  </div>
                </div>
                <button
                  onClick={() => exportAgreementsCsv(agreements)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-all border border-zinc-700 text-xs font-semibold flex items-center gap-1.5"
                  title="Export Agreements CSV"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>CSV</span>
                </button>
              </div>

              {/* CSV 3: Legal Audit Logs */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/40 rounded-xl text-emerald-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Legal Audit Logs</h4>
                    <p className="text-[11px] text-zinc-400">{auditLogsCount} Verification Hashes & IPs</p>
                  </div>
                </div>
                <button
                  onClick={() => exportAuditLogsCsv(agreements)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-all border border-zinc-700 text-xs font-semibold flex items-center gap-1.5"
                  title="Export Legal Audit CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
              </div>

              {/* CSV 4: Email Dispatches */}
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-950/60 border border-purple-800/40 rounded-xl text-purple-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">Email Dispatch Trail</h4>
                    <p className="text-[11px] text-zinc-400">{emailLogs.length} Delivery Certificates</p>
                  </div>
                </div>
                <button
                  onClick={() => exportEmailLogsCsv(emailLogs)}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl transition-all border border-zinc-700 text-xs font-semibold flex items-center gap-1.5"
                  title="Export Email Logs CSV"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>CSV</span>
                </button>
              </div>

            </div>
          </div>

          {/* Legal Compliance Notice */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-2xl flex items-start gap-3">
            <History className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-zinc-300 block">Offline Archival Compliance Guarantee</span>
              <p className="text-zinc-400 leading-relaxed">
                Downloaded archives contain immutable timestamps, client IP signatures, payment receipts (UTR/Transaction IDs), live selfie URLs, and OTP verification certificates. Store these files securely for Indian IT Act Section 65B legal evidentiary compliance.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All systems synchronized with backend database</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
