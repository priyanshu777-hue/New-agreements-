import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface ServerStore {
  agreements: any[];
  leads: any[];
  notifications: any[];
  emailLogs: any[];
}

/**
 * Load all store data from Firestore
 */
export async function loadFirestoreStore(): Promise<ServerStore> {
  try {
    const [agreementsSnap, leadsSnap, notifsSnap, logsSnap] = await Promise.all([
      getDocs(collection(firestoreDb, 'agreements')),
      getDocs(collection(firestoreDb, 'leads')),
      getDocs(collection(firestoreDb, 'notifications')),
      getDocs(collection(firestoreDb, 'emailLogs')),
    ]);

    const agreements = agreementsSnap.docs.map((d) => d.data());
    const leads = leadsSnap.docs.map((d) => d.data());
    const notifications = notifsSnap.docs.map((d) => d.data());
    const emailLogs = logsSnap.docs.map((d) => d.data());

    return { agreements, leads, notifications, emailLogs };
  } catch (error) {
    console.error('Error reading from Firestore store:', error);
    return { agreements: [], leads: [], notifications: [], emailLogs: [] };
  }
}

/**
 * Save or update a single agreement in Firestore
 */
export async function saveAgreementToFirestore(agreement: any): Promise<void> {
  if (!agreement || !agreement.id) return;
  try {
    const cleanId = agreement.id.trim();
    const ref = doc(firestoreDb, 'agreements', cleanId);
    
    // Check if exists to merge signed status properly
    const existingSnap = await getDoc(ref);
    let finalAgreement = agreement;
    if (existingSnap.exists()) {
      const existing = existingSnap.data();
      if (existing.status === 'Signed' && agreement.status !== 'Signed') {
        finalAgreement = {
          ...agreement,
          ...existing,
          status: 'Signed',
        };
      }
    }

    await setDoc(ref, finalAgreement, { merge: true });
  } catch (error) {
    console.error(`Error saving agreement ${agreement.id} to Firestore:`, error);
  }
}

/**
 * Save or update a single lead in Firestore
 */
export async function saveLeadToFirestore(lead: any): Promise<void> {
  if (!lead || !lead.id) return;
  try {
    const cleanId = lead.id.trim();
    const ref = doc(firestoreDb, 'leads', cleanId);
    await setDoc(ref, lead, { merge: true });
  } catch (error) {
    console.error(`Error saving lead ${lead.id} to Firestore:`, error);
  }
}

/**
 * Save or update a single notification in Firestore
 */
export async function saveNotificationToFirestore(notification: any): Promise<void> {
  if (!notification || !notification.id) return;
  try {
    const cleanId = notification.id.trim();
    const ref = doc(firestoreDb, 'notifications', cleanId);
    await setDoc(ref, notification, { merge: true });
  } catch (error) {
    console.error(`Error saving notification ${notification.id} to Firestore:`, error);
  }
}

/**
 * Save or update a single email log in Firestore
 */
export async function saveEmailLogToFirestore(emailLog: any): Promise<void> {
  if (!emailLog || !emailLog.id) return;
  try {
    const cleanId = emailLog.id.trim();
    const ref = doc(firestoreDb, 'emailLogs', cleanId);
    await setDoc(ref, emailLog, { merge: true });
  } catch (error) {
    console.error(`Error saving email log ${emailLog.id} to Firestore:`, error);
  }
}

/**
 * Fetch a single agreement by ID directly from Firestore
 */
export async function getAgreementFromFirestore(id: string): Promise<any | null> {
  try {
    const cleanId = id.trim();
    const ref = doc(firestoreDb, 'agreements', cleanId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.error(`Error fetching agreement ${id} from Firestore:`, error);
  }
  return null;
}
