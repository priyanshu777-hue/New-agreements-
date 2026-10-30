import React, { useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { FolderPlus, Loader2, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GooglePickerButtonProps {
  onFilePicked: (file: { id: string; name: string; url: string; mimeType: string }) => void;
  buttonText?: string;
  className?: string;
}

export const GooglePickerButton: React.FC<GooglePickerButtonProps> = ({
  onFilePicked,
  buttonText = 'Attach from Google Drive',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePickFile = async () => {
    setLoading(true);
    setStatusMessage('Authenticating with Google Drive...');

    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) {
        throw new Error('Could not obtain Google Drive OAuth access token.');
      }

      setStatusMessage('Opening Google Picker...');

      // Load gapi picker script if not already loaded
      if (!window.google || !window.google.picker) {
        await new Promise<void>((resolve, reject) => {
          if (window.gapi) {
            window.gapi.load('picker', { callback: resolve, onerror: reject });
          } else {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
              if (window.gapi) {
                window.gapi.load('picker', { callback: resolve, onerror: reject });
              } else {
                reject(new Error('gapi object not found on window'));
              }
            };
            script.onerror = reject;
            document.body.appendChild(script);
          }
        });
      }

      const pickerOrigin =
        window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setOrigin(pickerOrigin)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            if (doc) {
              onFilePicked({
                id: doc.id,
                name: doc.name,
                url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
                mimeType: doc.mimeType || 'application/vnd.google-apps.document',
              });
              setStatusMessage(`Attached "${doc.name}" from Google Drive`);
              setTimeout(() => setStatusMessage(null), 3000);
            }
          }
          setLoading(false);
        })
        .build();

      picker.setVisible(true);
    } catch (err: any) {
      console.error('Google Picker error:', err);
      setStatusMessage(err?.message || 'Failed to open Google Picker');
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handlePickFile}
        disabled={loading}
        className={
          className ||
          'flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-zinc-700 transition-all active:scale-95 disabled:opacity-50'
        }
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        ) : (
          <FolderPlus className="w-4 h-4 text-blue-400" />
        )}
        <span>{loading ? 'Opening Drive...' : buttonText}</span>
      </button>
      {statusMessage && (
        <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {statusMessage}
        </span>
      )}
    </div>
  );
};
