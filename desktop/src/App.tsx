import { useState } from 'react';
import ChatPanel from './components/ChatPanel';
import EditorPanel from './components/EditorPanel';
import FileExplorer from './components/FileExplorer';
import SettingsPanel from './components/SettingsPanel';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';

type Tab = 'chat' | 'editor' | 'files' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [apiConnected, setApiConnected] = useState(false);
  const [openFilePath, setOpenFilePath] = useState<string | null>(null);

  const handleFileSelect = (path: string) => {
    setOpenFilePath(path);
    setActiveTab('editor');
  };

  return (
    <div className="flex h-screen bg-lbt-dark text-slate-100 select-none">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && <ChatPanel onApiStatus={setApiConnected} />}
          {activeTab === 'editor' && <EditorPanel />}
          {activeTab === 'files' && <FileExplorer onFileSelect={handleFileSelect} />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>

        <StatusBar connected={apiConnected} />
      </main>
    </div>
  );
}

export default App;
