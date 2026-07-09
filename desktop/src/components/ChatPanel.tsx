import { AlertCircle, Bot, Loader2, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { checkHealth, sendMessage } from '../services/tauri-api';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Props {
  onApiStatus: (connected: boolean) => void;
}

export default function ChatPanel({ onApiStatus }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 Bienvenue sur **LBTCode** !\n\nJe suis ton assistant IA pour le développement. Pose-moi une question ou demande-moi de créer du code.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const check = async () => {
      const ok = await checkHealth();
      onApiStatus(ok);
      if (!ok) setError('Backend non connecté. Lancez `bun run dev:backend`');
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [onApiStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage(userMsg.content);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.content || 'Pas de réponse',
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setError(err.message);
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `❌ Erreur: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-lbt-panel/50 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
            <Bot size={22} />
            LBTCode Chat
          </h1>
          <p className="text-xs text-slate-500">Assistant IA de THE IT FOUNDATION</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : msg.role === 'assistant'
                    ? 'bg-lbt-panel text-slate-100 rounded-bl-md border border-slate-700'
                    : 'bg-red-900/30 text-red-200 border border-red-800/50 rounded-lg'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 text-xs opacity-70">
                {msg.role === 'user' ? (
                  <>
                    <User size={12} /> Toi
                  </>
                ) : msg.role === 'assistant' ? (
                  <>
                    <Bot size={12} /> LBTCode
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> Système
                  </>
                )}
                <span className="ml-auto text-[10px]">
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-lbt-panel border border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-blue-400" />
              <span className="text-sm text-slate-400">LBTCode réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-800 bg-lbt-panel/50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Écris ta demande... (ex: Crée une API REST en Express)"
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-medium text-sm transition flex items-center gap-2"
          >
            <Send size={16} />
            {loading ? '...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
