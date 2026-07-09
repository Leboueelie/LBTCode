import { AlertCircle, Check, Key, Loader2, Save, Settings, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { checkHealth, getConfig, login, setConfig } from '../services/tauri-api';

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'grok', label: 'xAI Grok' },
];

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-pro'],
  grok: ['grok-2', 'grok-2-mini'],
};

export default function SettingsPanel() {
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getConfig().then(c => {
      setProvider(c.provider || 'anthropic');
      setModel(c.model || '');
      setApiKey(c.apiKey || '');
      setBaseUrl(c.baseUrl || '');
    });
    checkHealth().then(h => setConnected(h));
  }, []);

  const providerModels = MODELS_BY_PROVIDER[provider] || [];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setConfig({ provider, model, apiKey, baseUrl });
      setMessage({ type: 'success', text: 'Configuration sauvegardée' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.toString() });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await login({ provider, apiKey, model, baseUrl });
      if (res.success) {
        setMessage({ type: 'success', text: `Connecté à ${provider}` });
        setConnected(true);
      } else {
        setMessage({ type: 'error', text: res.error || 'Échec de connexion' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.toString() });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-slate-800 bg-lbt-panel/50">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={18} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-slate-200">Paramètres</h2>
        </div>
        <p className="text-xs text-slate-500">Configuration du provider IA</p>
      </div>

      <div className="flex-1 px-6 py-4 space-y-5">
        {/* Statut connexion */}
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${connected ? 'bg-green-900/20 border-green-800/30 text-green-400' : 'bg-red-900/20 border-red-800/30 text-red-400'}`}
        >
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? 'API connectée' : 'API déconnectée — configure ton provider ci-dessous'}
        </div>

        {/* Provider */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Provider</label>
          <select
            value={provider}
            onChange={e => {
              setProvider(e.target.value);
              setModel('');
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Modèle */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Modèle</label>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">— Sélectionne un modèle —</option>
            {providerModels.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="custom">Autre (saisir ci-dessous)</option>
          </select>
          {model === 'custom' && (
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="Nom du modèle personnalisé..."
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          )}
        </div>

        {/* Clé API */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Key size={12} />
            Clé API
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-... ou laisser vide pour utiliser les variables d'env"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Base URL (optionnel) */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Base URL <span className="text-slate-600">(optionnel)</span>
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="https://api.anthropic.com (défaut)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Message */}
        {message && (
          <div
            className={`text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-800/30 text-green-400' : 'bg-red-900/20 border-red-800/30 text-red-400'}`}
          >
            {message.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
            {message.text}
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
            Tester la connexion
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
