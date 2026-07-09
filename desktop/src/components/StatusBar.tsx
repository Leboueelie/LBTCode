import { Wifi, WifiOff } from 'lucide-react';

interface Props {
  connected: boolean;
}

export default function StatusBar({ connected }: Props) {
  return (
    <div className="h-8 bg-lbt-panel border-t border-slate-800 flex items-center px-4 text-[11px] text-slate-500 justify-between">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          {connected ? (
            <>
              <Wifi size={12} className="text-green-400" /> <span className="text-green-400">API connectée</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-400" /> <span className="text-red-400">API déconnectée</span>
            </>
          )}
        </span>
        <span>LBTCode v1.0.0</span>
      </div>
      <div className="flex items-center gap-4">
        <span>THE IT FOUNDATION</span>
        <span className="text-slate-600">|</span>
        <span>Modèle: DeepSeek (configurable)</span>
      </div>
    </div>
  );
}
