import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/auth/LoginScreen';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AgreementGenerator } from './components/agreements/AgreementGenerator';
import { AgreementPreviewModal } from './components/agreements/AgreementPreviewModal';
import { AgreementList } from './components/agreements/AgreementList';
import { PublicSigningPortal } from './components/signing/PublicSigningPortal';
import { ReportsView } from './components/reports/ReportsView';
import { EmailLogsView } from './components/email/EmailLogsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { TemplateChatbot } from './components/chat/TemplateChatbot';
import { LeadDetailDrawer } from './components/leads/LeadDetailDrawer';
import { DataBackupModal } from './components/modals/DataBackupModal';

import { RedFlagLogo } from './components/common/RedFlagLogo';
import { AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';

import { getDocs, collection } from 'firebase/firestore';
import { db } from './lib/firebase';
import {
  INITIAL_LEADS,
  INITIAL_AGREEMENTS,
  INITIAL_STAFF_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_EMAIL_LOGS,
} from './data/initialData';
import { Lead, AgreementData, StaffUser, SystemNotification, EmailLog, AuditTrail } from './types/crm';

const MOCK_LEAD_IDS = ['lead_101', 'lead_102', 'lead_103', 'lead_104', 'lead_105', 'lead_106'];
const MOCK_AGREEMENT_IDS = ['RFH-MOU-2026-8921', 'RFH-MOU-2026-4412', 'RFH-MOU-2026-1002'];

export default function App() {
  // Check if opening direct public signing link e.g. /sign/RFH-MOU-2026-8921
  const path = window.location.pathname;
  const isDirectSignLink = path.startsWith('/sign/');
  const directSignAgrId = isDirectSignLink ? path.split('/sign/')[1] : null;

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('rfh_authenticated') === 'true';
  });

  // Persistent or seed states
  const [staffList, setStaffList] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem('rfh_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF_USERS;
  });

  const [currentUser, setCurrentUser] = useState<StaffUser>(() => staffList[0]);

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('rfh_leads');
    if (!saved) return INITIAL_LEADS;
    try {
      const parsed: Lead[] = JSON.parse(saved);
      const clean = parsed.filter((l) => l && l.id && !MOCK_LEAD_IDS.includes(l.id));
      return clean.length > 0 ? clean : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  const [agreements, setAgreements] = useState<AgreementData[]>(() => {
    const saved = localStorage.getItem('rfh_agreements');
    if (!saved) return INITIAL_AGREEMENTS;
    try {
      const parsed: AgreementData[] = JSON.parse(saved);
      const clean = parsed.filter((a) => a && a.id && !MOCK_AGREEMENT_IDS.includes(a.id));
      return clean.length > 0 ? clean : INITIAL_AGREEMENTS;
    } catch {
      return INITIAL_AGREEMENTS;
    }
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('rfh_notifications');
    if (!saved) return INITIAL_NOTIFICATIONS;
    try {
      const parsed: SystemNotification[] = JSON.parse(saved);
      return parsed.filter((n) => n && n.id);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem('rfh_email_logs');
    if (!saved) return INITIAL_EMAIL_LOGS;
    try {
      const parsed: EmailLog[] = JSON.parse(saved);
      return parsed.filter((e) => e && e.id);
    } catch {
      return INITIAL_EMAIL_LOGS;
    }
  });

  // UI Navigation & Selection states
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAgreementGeneratorOpen, setIsAgreementGeneratorOpen] = useState(false);
  const [selectedLeadForAgreement, setSelectedLeadForAgreement] = useState<Lead | null>(null);
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<Lead | null>(null);
  const [previewAgreement, setPreviewAgreement] = useState<AgreementData | null>(null);

  const [isSigningPortalActive, setIsSigningPortalActive] = useState<boolean>(isDirectSignLink);
  const [isDirectLinkLoading, setIsDirectLinkLoading] = useState<boolean>(isDirectSignLink);
  const [directLinkError, setDirectLinkError] = useState<string | null>(null);

  const [signingAgreement, setSigningAgreement] = useState<AgreementData | null>(() => {
    if (directSignAgrId) {
      const cleanId = directSignAgrId.trim().toLowerCase();
      return agreements.find((a) => a.id.trim().toLowerCase() === cleanId) || null;
    }
    return agreements[0] || null;
  });

  // Direct Agreement Lookup Effect for Public Signing Portal Links (/sign/:id)
  useEffect(() => {
    if (!isDirectSignLink || !directSignAgrId) return;

    let isMounted = true;
    const loadDirectAgreement = async () => {
      setIsDirectLinkLoading(true);
      setDirectLinkError(null);

      const cleanId = directSignAgrId.trim().toLowerCase();

      // 1. Check if agreement exists in local state first
      const localMatch = agreements.find((a) => a.id.trim().toLowerCase() === cleanId);
      if (localMatch) {
        setSigningAgreement(localMatch);
      }

      // 2. Fetch specific agreement directly from backend server database store
      try {
        const res = await fetch(`/api/agreements/${encodeURIComponent(directSignAgrId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.agreement && isMounted) {
            setSigningAgreement(data.agreement);
            setAgreements((prev) => {
              const exists = prev.some((a) => a.id.trim().toLowerCase() === cleanId);
              const next = exists
                ? prev.map((a) => (a.id.trim().toLowerCase() === cleanId ? data.agreement : a))
                : [data.agreement, ...prev];
              localStorage.setItem('rfh_agreements', JSON.stringify(next));
              return next;
            });
            setIsDirectLinkLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Direct agreement server fetch warning:', err);
      }

      if (isMounted) {
        if (localMatch) {
          setIsDirectLinkLoading(false);
        } else {
          setDirectLinkError(
            `Agreement "${directSignAgrId}" was not found in the Red Flag Homes Database. Please verify the URL link or contact your sales executive.`
          );
          setSigningAgreement(null);
          setIsDirectLinkLoading(false);
        }
      }
    };

    loadDirectAgreement();

    return () => {
      isMounted = false;
    };
  }, [directSignAgrId, isDirectSignLink]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Server Sync & Real Client Restoration State
  const [isServerSyncing, setIsServerSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const fetchAndRestoreServerData = async (manual = false) => {
    setIsServerSyncing(true);
    try {
      let serverAgreements: AgreementData[] = [];
      let serverLeads: Lead[] = [];
      let serverNotifs: SystemNotification[] = [];
      let serverLogs: EmailLog[] = [];

      // 1. Fetch full server database store first
      try {
        const res = await fetch('/api/sync/all');
        if (res.ok) {
          const data = await res.json();
          if (data.store) {
            serverAgreements = data.store.agreements || [];
            serverLeads = data.store.leads || [];
            serverNotifs = data.store.notifications || [];
            serverLogs = data.store.emailLogs || [];
          }
        }
      } catch (err) {
        console.warn('API sync warning:', err);
      }

      // 2. Secondary Direct Cloud Firestore SDK fetch fallback to guarantee new devices load records instantly
      if (serverAgreements.length === 0 || serverLeads.length === 0) {
        try {
          const [agrSnap, leadSnap, notifSnap, logSnap] = await Promise.all([
            getDocs(collection(db, 'agreements')),
            getDocs(collection(db, 'leads')),
            getDocs(collection(db, 'notifications')),
            getDocs(collection(db, 'emailLogs')),
          ]);

          if (!agrSnap.empty) {
            serverAgreements = agrSnap.docs.map((d) => d.data() as AgreementData);
          }
          if (!leadSnap.empty) {
            serverLeads = leadSnap.docs.map((d) => d.data() as Lead);
          }
          if (!notifSnap.empty) {
            serverNotifs = notifSnap.docs.map((d) => d.data() as SystemNotification);
          }
          if (!logSnap.empty) {
            serverLogs = logSnap.docs.map((d) => d.data() as EmailLog);
          }
        } catch (fsErr) {
          console.warn('Direct Firestore client sync warning:', fsErr);
        }
      }

      // 3. Clean server state from any obsolete mock IDs
      serverAgreements = serverAgreements.filter((a) => a && a.id && !MOCK_AGREEMENT_IDS.includes(a.id));
      serverLeads = serverLeads.filter((l) => l && l.id && !MOCK_LEAD_IDS.includes(l.id));

      // 4. Merge server state with current state
      let mergedAgreements: AgreementData[] = [];
      setAgreements((prev) => {
        const map = new Map<string, AgreementData>();
        serverAgreements.forEach((a) => map.set(a.id.trim().toLowerCase(), a));
        prev.forEach((a) => {
          if (!a || !a.id || MOCK_AGREEMENT_IDS.includes(a.id)) return;
          const key = a.id.trim().toLowerCase();
          const existing = map.get(key);
          if (!existing) {
            map.set(key, a);
          } else if (existing.status !== 'Signed' && a.status === 'Signed') {
            map.set(key, a);
          } else if (existing.status === 'Signed' && a.status !== 'Signed') {
            // keep existing signed server record
          } else {
            map.set(key, { ...existing, ...a });
          }
        });
        mergedAgreements = Array.from(map.values());
        localStorage.setItem('rfh_agreements', JSON.stringify(mergedAgreements));
        return mergedAgreements;
      });

      let mergedLeads: Lead[] = [];
      setLeads((prev) => {
        const map = new Map<string, Lead>();
        serverLeads.forEach((l) => map.set(l.id.trim().toLowerCase(), l));
        prev.forEach((l) => {
          if (!l || !l.id || MOCK_LEAD_IDS.includes(l.id)) return;
          const key = l.id.trim().toLowerCase();
          const existing = map.get(key);
          if (!existing) {
            map.set(key, l);
          } else {
            map.set(key, { ...existing, ...l });
          }
        });
        mergedLeads = Array.from(map.values());
        localStorage.setItem('rfh_leads', JSON.stringify(mergedLeads));
        return mergedLeads;
      });

      let mergedNotifs: SystemNotification[] = [];
      setNotifications((prev) => {
        const map = new Map<string, SystemNotification>();
        serverNotifs.forEach((n) => map.set(n.id, n));
        prev.forEach((n) => {
          if (n && n.id && !map.has(n.id)) map.set(n.id, n);
        });
        mergedNotifs = Array.from(map.values());
        localStorage.setItem('rfh_notifications', JSON.stringify(mergedNotifs));
        return mergedNotifs;
      });

      let mergedLogs: EmailLog[] = [];
      setEmailLogs((prev) => {
        const map = new Map<string, EmailLog>();
        serverLogs.forEach((e) => map.set(e.id, e));
        prev.forEach((e) => {
          if (e && e.id && !map.has(e.id)) map.set(e.id, e);
        });
        mergedLogs = Array.from(map.values());
        localStorage.setItem('rfh_email_logs', JSON.stringify(mergedLogs));
        return mergedLogs;
      });

      // 5. Push merged state back to server store
      await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreements: mergedAgreements,
          leads: mergedLeads,
          notifications: mergedNotifs,
          emailLogs: mergedLogs,
        }),
      });

      if (manual) {
        setSyncMessage('Database synced across device network!');
        setTimeout(() => setSyncMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Server restoration error:', err);
    } finally {
      setIsServerSyncing(false);
    }
  };

  useEffect(() => {
    fetchAndRestoreServerData(false);
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('rfh_authenticated', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('rfh_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('rfh_agreements', JSON.stringify(agreements));
  }, [agreements]);

  useEffect(() => {
    localStorage.setItem('rfh_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('rfh_email_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  // Handle Login
  const handleLoginSuccess = (userEmail: string) => {
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.setItem('rfh_authenticated', 'false');
  };

  // Open Agreement Generator from any view
  const handleOpenAgreementGenerator = (lead?: Lead | null) => {
    setSelectedLeadForAgreement(lead || null);
    setIsAgreementGeneratorOpen(true);
    setActiveTab('agreements');
    if (selectedLeadForDrawer) {
      setSelectedLeadForDrawer(null);
    }
  };

  // Lead Operations
  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads((prev) => {
      const next = prev.map((l) => (l.id === updatedLead.id ? updatedLead : l));
      localStorage.setItem('rfh_leads', JSON.stringify(next));
      return next;
    });
    if (selectedLeadForDrawer?.id === updatedLead.id) {
      setSelectedLeadForDrawer(updatedLead);
    }
    // Persist lead changes (including documents) to backend server & Cloud Firestore
    fetch('/api/leads/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead: updatedLead }),
    }).catch((err) => console.warn('Failed to sync lead update to server:', err));
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setSelectedLeadForDrawer(null);
  };

  // MOU Agreement Operations
  const handleGenerateAgreement = (newAgreement: AgreementData) => {
    setAgreements((prev) => [newAgreement, ...prev]);
    setIsAgreementGeneratorOpen(false);
    setPreviewAgreement(newAgreement);

    // Create or update associated lead record for client
    const assocLead: Lead = {
      id: newAgreement.leadId || `lead_${Date.now()}`,
      fullName: newAgreement.partyAName,
      mobileNumber: newAgreement.partyAMobile || '+91 98000 00000',
      email: newAgreement.partyAEmail || '',
      city: newAgreement.place ? newAgreement.place.split(',')[0].trim() : 'New Delhi',
      propertyAddress: newAgreement.propertyAddress || 'Pending property details',
      numberOfProperties: 1,
      expectedRevenue: 350000,
      source: 'Website',
      salesExecutiveId: 'usr_1',
      salesExecutiveName: newAgreement.salesExecutiveName || 'Vikramaditya Roy',
      stage: newAgreement.status === 'Signed' ? 'Signed' : 'Agreement Sent',
      whatsappStatus: 'Shared MOU',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      agreementId: newAgreement.id,
      notes: [`Generated agreement ${newAgreement.id} for ${newAgreement.partyAName}.`],
      documents: [],
      callHistory: [],
    };

    setLeads((prev) => {
      const exists = prev.some(
        (l) => l.id === assocLead.id || (l.email && assocLead.email && l.email.toLowerCase() === assocLead.email.toLowerCase())
      );
      const nextLeads = exists
        ? prev.map((l) =>
            l.id === assocLead.id || (l.email && assocLead.email && l.email.toLowerCase() === assocLead.email.toLowerCase())
              ? { ...l, stage: assocLead.stage, agreementId: newAgreement.id }
              : l
          )
        : [assocLead, ...prev];
      localStorage.setItem('rfh_leads', JSON.stringify(nextLeads));
      return nextLeads;
    });

    // Sync newly generated agreement AND associated lead to server persistent database immediately
    fetch('/api/agreements/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement: newAgreement, lead: assocLead }),
    }).catch((err) => console.warn('Failed to sync new agreement & lead to server:', err));

    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'Signing Link Dispatched',
      message: `MOU ${newAgreement.id} generated for ${newAgreement.partyAName}. Signing link active.`,
      timestamp: new Date().toISOString(),
      type: 'opened',
      agreementId: newAgreement.id,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // E-Signature Completion & Stage Update Handlers
  const handleUpdateAgreement = (updatedAgr: AgreementData) => {
    setAgreements((prev) => {
      const exists = prev.some((a) => a.id.trim().toLowerCase() === updatedAgr.id.trim().toLowerCase());
      const next = exists
        ? prev.map((a) => (a.id.trim().toLowerCase() === updatedAgr.id.trim().toLowerCase() ? updatedAgr : a))
        : [updatedAgr, ...prev];
      localStorage.setItem('rfh_agreements', JSON.stringify(next));
      return next;
    });

    setSigningAgreement(updatedAgr);

    // Sync updated agreement directly to backend server database store
    fetch('/api/agreements/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agreement: updatedAgr }),
    }).catch((err) => console.warn('Failed to sync updated agreement to server:', err));

    // Sync associated lead stage in real-time
    setLeads((prevLeads) => {
      const nextLeads = prevLeads.map((l) => {
        const isMatch =
          l.id === updatedAgr.leadId ||
          (l.email && updatedAgr.partyAEmail && l.email.trim().toLowerCase() === updatedAgr.partyAEmail.trim().toLowerCase()) ||
          (l.fullName && updatedAgr.partyAName && l.fullName.trim().toLowerCase() === updatedAgr.partyAName.trim().toLowerCase());
        if (isMatch) {
          const newStage = updatedAgr.status === 'Signed' ? 'Signed' : (updatedAgr.status as any);
          return { ...l, stage: newStage };
        }
        return l;
      });
      localStorage.setItem('rfh_leads', JSON.stringify(nextLeads));
      return nextLeads;
    });
  };

  const handleCompleteSigning = (signedAgr: AgreementData, auditTrail: AuditTrail) => {
    const strictlySigned: AgreementData = { ...signedAgr, status: 'Signed' };
    handleUpdateAgreement(strictlySigned);

    // Email Logs
    const clientEmailLog: EmailLog = {
      id: `email_${Date.now()}`,
      sender: 'agreements@redflaghomes.in',
      recipient: strictlySigned.partyAEmail || strictlySigned.partyAName,
      recipientType: 'Client',
      subject: `Welcome to Red Flag Homes! Signed MOU Executed - ${strictlySigned.title}`,
      agreementId: strictlySigned.id,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
      attachments: ['Signed_MOU_Agreement.pdf', `Audit_Certificate_${auditTrail.certificateId}.pdf`],
    };

    const onboardingEmailLog: EmailLog = {
      id: `email_onboarding_${Date.now()}`,
      sender: 'agreements@redflaghomes.in',
      recipient: 'hello@redflaghomes.in, agreements@redflaghomes.in',
      recipientType: 'Internal Onboarding',
      subject: `[NEW CLIENT ONBOARDED] Signed MOU ${strictlySigned.id} - ${strictlySigned.partyAName}`,
      agreementId: strictlySigned.id,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
      attachments: ['Signed_MOU_Agreement.pdf', `Audit_Certificate_${auditTrail.certificateId}.pdf`],
    };

    setEmailLogs((prev) => [clientEmailLog, onboardingEmailLog, ...prev]);

    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Client Onboarded!',
      message: `${strictlySigned.partyAName} signed MOU ${strictlySigned.id}. Automated welcome email sent with PDF attachment.`,
      timestamp: new Date().toISOString(),
      type: 'signed',
      agreementId: strictlySigned.id,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleOpenSigningPortalForAgreement = (agr: AgreementData) => {
    setSigningAgreement(agr);
    setIsSigningPortalActive(true);
  };

  const handleTriggerTestEmail = (recipient: string, subject: string, agreementId: string) => {
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient,
        subject,
        agreementId,
        bodyText: `Red Flag Homes Listing & Property Management MOU Agreement ${agreementId} executed dispatches.`,
        attachments: ['Signed_MOU_Document.pdf', 'Audit_Certificate.pdf'],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Backend email dispatch response:', data);
      })
      .catch((err) => console.error('Backend email dispatch error:', err));

    const newLog: EmailLog = {
      id: `email_${Date.now()}`,
      sender: 'agreements@redflaghomes.in',
      recipient,
      recipientType: 'Client',
      subject,
      agreementId,
      status: 'Delivered',
      sentAt: new Date().toISOString(),
      attachments: ['Signed_MOU_Document.pdf', 'Audit_Certificate.pdf'],
    };
    setEmailLogs((prev) => [newLog, ...prev]);

    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'Email Sent to Client',
      message: `MOU ${agreementId} email dispatched to ${recipient}.`,
      timestamp: new Date().toISOString(),
      type: 'reminder',
      agreementId,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Direct public client signing portal view (e.g., /sign/:id)
  if (isSigningPortalActive || isDirectSignLink) {
    if (isDirectLinkLoading) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 space-y-4">
          <RedFlagLogo size="lg" />
          <div className="flex items-center gap-3 text-red-500 bg-zinc-900 px-5 py-3 rounded-2xl border border-zinc-800 shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-mono font-bold">Verifying & Loading E-Sign Portal...</span>
          </div>
        </div>
      );
    }

    if (directLinkError || !signingAgreement) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-red-950 text-red-500 border border-red-800/80 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block">
                Invalid Signing Link
              </span>
              <h2 className="text-xl font-black text-white">Agreement Not Found</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {directLinkError || `Agreement ID "${directSignAgrId}" could not be retrieved from the Red Flag Homes Database.`}
              </p>
            </div>

            {directSignAgrId && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-400">
                Requested ID: <span className="text-red-400 font-bold">{directSignAgrId}</span>
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition-all min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Red Flag Portal</span>
              </a>

              <a
                href={`mailto:agreements@redflaghomes.in?subject=Help with Agreement Link ${directSignAgrId || ''}`}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-3 rounded-xl border border-zinc-700 transition-colors min-h-[44px]"
              >
                <Mail className="w-4 h-4 text-red-400" />
                <span>Contact Desk: agreements@redflaghomes.in</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <PublicSigningPortal
        agreement={signingAgreement}
        onUpdateAgreement={handleUpdateAgreement}
        onCompleteSigning={handleCompleteSigning}
        onBackToCRM={isAuthenticated ? () => setIsSigningPortalActive(false) : undefined}
      />
    );
  }

  // Render Login Screen if unauthenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={(role) => setCurrentUser({ ...currentUser, role })}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenNewLeadModal={() => handleOpenAgreementGenerator(null)}
        onOpenNewAgreementModal={() => handleOpenAgreementGenerator(null)}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        staffList={staffList}
        onUserSelect={(u) => setCurrentUser(u)}
        onSignOut={handleSignOut}
        onSyncServerData={() => fetchAndRestoreServerData(true)}
        isSyncing={isServerSyncing}
        syncMessage={syncMessage}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'sign-portal') {
              setSigningAgreement(agreements[0]);
              setIsSigningPortalActive(true);
            }
          }}
          pendingAgreementsCount={
            agreements.filter((a) => a.status === 'Inactive' || a.status === 'Awaiting Signature' || a.status === 'Viewed').length
          }
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-zinc-950/60 pb-20 md:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              leads={leads}
              agreements={agreements}
              staffList={staffList}
              onSelectLead={(lead) => setSelectedLeadForDrawer(lead)}
              onOpenNewLead={() => handleOpenAgreementGenerator(null)}
              onOpenNewAgreement={() => handleOpenAgreementGenerator(null)}
              onNavigateToTab={(tab) => {
                if (tab === 'agreements' || tab === 'reports' || tab === 'sign-portal') {
                  setActiveTab(tab);
                } else {
                  setActiveTab('agreements');
                }
              }}
              notifications={notifications}
            />
          )}

          {activeTab === 'agreements' && (
            <div className="space-y-6">
              {isAgreementGeneratorOpen ? (
                <AgreementGenerator
                  selectedLead={selectedLeadForAgreement}
                  staffList={staffList}
                  onGenerateAgreement={handleGenerateAgreement}
                  onClose={() => {
                    setIsAgreementGeneratorOpen(false);
                    setSelectedLeadForAgreement(null);
                  }}
                />
              ) : (
                <AgreementList
                  agreements={agreements}
                  onOpenNewAgreementModal={() => handleOpenAgreementGenerator(null)}
                  onPreviewAgreement={(a) => setPreviewAgreement(a)}
                  onOpenSigningPortal={handleOpenSigningPortalForAgreement}
                  onSendEmailReminder={(a) => handleTriggerTestEmail(a.partyAEmail || a.salesExecutiveEmail, `Reminder: ${a.title}`, a.id)}
                />
              )}
            </div>
          )}

          {activeTab === 'audit-logs' && (
            <AuditLogsView
              agreements={agreements}
              onSelectAgreement={(a) => setPreviewAgreement(a)}
              onOpenSigningPortal={handleOpenSigningPortalForAgreement}
            />
          )}

          {activeTab === 'ai-chat' && (
            <TemplateChatbot
              onSaveTemplateToCRM={(tpl) => {
                const notif: SystemNotification = {
                  id: `notif_tpl_${Date.now()}`,
                  title: 'New AI Template Added',
                  message: `Template "${tpl.title}" created via Gemini AI Architect and added to generator.`,
                  timestamp: new Date().toISOString(),
                  type: 'opened',
                  read: false,
                };
                setNotifications((prev) => [notif, ...prev]);
              }}
            />
          )}

          {activeTab === 'email-logs' && (
            <EmailLogsView
              emailLogs={emailLogs}
              agreements={agreements}
              onTriggerTestEmail={handleTriggerTestEmail}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView leads={leads} agreements={agreements} staffList={staffList} />
          )}
        </main>
      </div>

      {/* Lead Detail Drawer */}
      {selectedLeadForDrawer && (
        <LeadDetailDrawer
          lead={selectedLeadForDrawer}
          onClose={() => setSelectedLeadForDrawer(null)}
          onUpdateLead={handleUpdateLead}
          onDeleteLead={handleDeleteLead}
          onOpenAgreementForLead={(lead) => handleOpenAgreementGenerator(lead)}
          agreements={agreements}
          emailLogs={emailLogs}
        />
      )}

      {/* Modals & Drawers */}
      <AgreementPreviewModal
        agreement={previewAgreement}
        onClose={() => setPreviewAgreement(null)}
        onSendEmailToClient={(a) => handleTriggerTestEmail(a.partyAEmail || a.salesExecutiveEmail, `Executed MOU: ${a.title}`, a.id)}
        onOpenSigningPortal={(a) => {
          setPreviewAgreement(null);
          handleOpenSigningPortalForAgreement(a);
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        leads={leads}
        agreements={agreements}
        onSelectLead={(lead) => {
          setIsGlobalSearchOpen(false);
          setSelectedLeadForDrawer(lead);
        }}
        onSelectAgreement={(a) => {
          setIsGlobalSearchOpen(false);
          setPreviewAgreement(a);
        }}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        leads={leads}
        agreements={agreements}
        emailLogs={emailLogs}
        notifications={notifications}
        currentUser={currentUser}
      />
    </div>
  );
}
