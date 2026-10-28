import React from 'react';
import {
  LayoutDashboard,
  FileSignature,
  ShieldCheck,
  PenTool,
  MailCheck,
  BarChart3,
  Sparkles,
  Bot,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'agreements' | 'audit-logs' | 'ai-chat' | 'sign-portal' | 'email-logs' | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingAgreementsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingAgreementsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      fullLabel: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'agreements' as NavTab,
      label: 'Agreements',
      fullLabel: 'Agreements & Templates',
      icon: FileSignature,
      badge: pendingAgreementsCount > 0 ? pendingAgreementsCount : null,
    },
    {
      id: 'audit-logs' as NavTab,
      label: 'Audit Logs',
      fullLabel: 'Client Audit Logs',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'ai-chat' as NavTab,
      label: 'AI Architect',
      fullLabel: 'AI Template Architect',
      icon: Bot,
      badge: 'Gemini',
    },
    {
      id: 'sign-portal' as NavTab,
      label: 'Sign Portal',
      fullLabel: 'Signing Portal Demo',
      icon: PenTool,
      badge: 'Live',
    },
    {
      id: 'email-logs' as NavTab,
      label: 'Emails',
      fullLabel: 'Email Automation',
      icon: MailCheck,
      badge: null,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports',
      fullLabel: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (md and above) */}
      <aside className="hidden md:flex w-64 bg-zinc-950 border-r border-zinc-800/80 p-4 flex-col justify-between shrink-0 h-full">
        <div className="space-y-6">
          {/* Navigation Category Label */}
          <div className="px-3 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
              Red Flag Homes Desk
            </span>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all group ${
                    isActive
                      ? 'bg-red-600/15 text-red-400 border border-red-500/30 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-red-500' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    />
                    <span>{item.fullLabel}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badge === 'Live'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Banner */}
        <div className="pt-4 mt-auto border-t border-zinc-900">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>Master MOU Dispatch</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-snug">
              Sending from <strong className="text-zinc-200">agreements@redflaghomes.in</strong> with automated dispatches.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (sm and smaller) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-red-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-zinc-400'}`} />
                {item.badge !== null && typeof item.badge === 'number' && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
