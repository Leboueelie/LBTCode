import { ArrowUp, ChevronDown, ChevronRight, File, Folder, Home, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { tauriGetCwd, tauriListDir } from '../services/tauri-api';

interface FileEntry {
  name: string;
  isDirectory: boolean;
  fullPath: string;
}

interface Props {
  onFileSelect?: (path: string) => void;
}

export default function FileExplorer({ onFileSelect }: Props) {
  const [cwd, setCwd] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [dirContents, setDirContents] = useState<Record<string, FileEntry[]>>({});
  const [error, setError] = useState<string | null>(null);

  const loadDir = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const raw = await tauriListDir(path);
      const parsed = raw
        .map(p => {
          const parts = p.replace(/\\/g, '/').split('/');
          return {
            name: parts[parts.length - 1] || p,
            isDirectory: !p.includes('.'),
            fullPath: p,
          };
        })
        .filter(e => e.name)
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      return parsed;
    } catch (err: any) {
      setError(err.toString());
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tauriGetCwd().then(async dir => {
      setCwd(dir);
      const items = await loadDir(dir);
      setEntries(items);
    });
  }, [loadDir]);

  const toggleDir = useCallback(
    async (path: string) => {
      const next = new Set(expandedDirs);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        const items = await loadDir(path);
        setDirContents(prev => ({ ...prev, [path]: items }));
      }
      setExpandedDirs(next);
    },
    [expandedDirs, loadDir]
  );

  const goUp = useCallback(async () => {
    const parent = cwd.split('/').slice(0, -1).join('/') || '/';
    setCwd(parent);
    const items = await loadDir(parent);
    setEntries(items);
  }, [cwd, loadDir]);

  const renderEntry = (entry: FileEntry, depth = 0) => {
    const isExpanded = expandedDirs.has(entry.fullPath);
    const children = dirContents[entry.fullPath];

    return (
      <div key={entry.fullPath}>
        <button
          className="w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-slate-800 rounded transition-colors text-left"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (entry.isDirectory) {
              toggleDir(entry.fullPath);
            } else {
              onFileSelect?.(entry.fullPath);
            }
          }}
        >
          {entry.isDirectory ? (
            <>
              {isExpanded ? (
                <ChevronDown size={12} className="shrink-0 text-slate-400" />
              ) : (
                <ChevronRight size={12} className="shrink-0 text-slate-400" />
              )}
              <Folder size={14} className="shrink-0 text-amber-400" />
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              <File size={14} className="shrink-0 text-blue-400" />
            </>
          )}
          <span className="truncate text-slate-300">{entry.name}</span>
          {entry.isDirectory && isExpanded && children && (
            <span className="ml-auto text-slate-600 text-[10px]">{children.length} éléments</span>
          )}
        </button>
        {entry.isDirectory && isExpanded && children && (
          <div>{children.map(child => renderEntry(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 bg-lbt-panel/50">
        <div className="flex items-center gap-2 mb-2">
          <Folder size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">Explorateur</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goUp}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs transition flex items-center gap-1"
          >
            <ArrowUp size={12} />
          </button>
          <span className="text-xs text-slate-500 font-mono truncate flex-1">{cwd}</span>
          <button
            onClick={async () => {
              const dir = await tauriGetCwd();
              setCwd(dir);
              const items = await loadDir(dir);
              setEntries(items);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs transition"
          >
            <Home size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400 text-xs">{error}</div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs">Dossier vide</div>
        ) : (
          entries.map(e => renderEntry(e))
        )}
      </div>
    </div>
  );
}
