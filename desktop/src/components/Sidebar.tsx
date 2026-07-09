import { FileCode, FolderOpen, MessageSquare, Settings } from 'lucide-react';

type Tab = 'chat' | 'editor' | 'files' | 'settings';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
  { id: 'editor', label: 'Éditeur', icon: <FileCode size={20} /> },
  { id: 'files', label: 'Fichiers', icon: <FolderOpen size={20} /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings size={20} /> },
];

export default function Sidebar({ activeTab, onTabChange }: Props) {
  return (
    <aside className="w-16 bg-lbt-panel border-r border-slate-800 flex flex-col items-center py-4 gap-2">
      <div className="mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
          L
        </div>
      </div>

      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative group ${
            activeTab === tab.id
              ? 'bg-blue-600/20 text-blue-400 shadow-inner'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
          title={tab.label}
        >
          {tab.icon}
          {activeTab === tab.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full" />
          )}

          <span className="absolute left-14 bg-slate-800 text-slate-100 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">
            {tab.label}
          </span>
        </button>
      ))}
    </aside>
  );
}
