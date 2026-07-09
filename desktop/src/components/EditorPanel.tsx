import { AlertCircle, Check, FileCode, FolderOpen, Loader2, Save } from 'lucide-react';
import { useCallback, useState } from 'react';
import { tauriGetCwd, tauriReadFile, tauriWriteFile } from '../services/tauri-api';

export default function EditorPanel() {
  const [filePath, setFilePath] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cwd, setCwd] = useState('');

  useState(() => {
    tauriGetCwd()
      .then(setCwd)
      .catch(() => setCwd(''));
  });

  const handleOpen = useCallback(async () => {
    if (!filePath.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const text = await tauriReadFile(filePath.trim());
      setContent(text);
      setMessage({ type: 'success', text: 'Fichier chargé' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.toString() });
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const handleSave = useCallback(async () => {
    if (!filePath.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await tauriWriteFile(filePath.trim(), content);
      setMessage({ type: 'success', text: 'Fichier sauvegardé' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.toString() });
    } finally {
      setSaving(false);
    }
  }, [filePath, content]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 bg-lbt-panel/50">
        <div className="flex items-center gap-2 mb-2">
          <FileCode size={18} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Éditeur de code</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={filePath}
            onChange={e => setFilePath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpen()}
            placeholder={cwd ? `${cwd}/...` : 'Chemin du fichier...'}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            onClick={handleOpen}
            disabled={loading || !filePath.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
            Ouvrir
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !filePath.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Sauvegarder
          </button>
        </div>
        {message && (
          <div
            className={`mt-2 text-xs flex items-center gap-1.5 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
          >
            {message.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
            {message.text}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full h-full bg-slate-900 text-slate-100 font-mono text-sm p-4 resize-none focus:outline-none border-0"
          spellCheck={false}
          placeholder="Ouvre un fichier pour commencer à éditer..."
        />
      </div>
    </div>
  );
}
