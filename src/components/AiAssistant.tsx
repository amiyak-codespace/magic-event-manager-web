import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Loader2, Bot, User, ChevronDown,
  Wand2, CalendarPlus, BarChart3, Share2,
} from 'lucide-react';
import { aiApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  context?: string;
  onEventDataExtracted?: (data: Record<string, unknown>) => void;
}

const QUICK_PROMPTS = [
  { icon: CalendarPlus, label: 'Create event from idea', msg: 'Help me create an event. I want to host a tech meetup next Saturday in Bengaluru for about 50 developers.' },
  { icon: BarChart3, label: 'Improve event description', msg: 'Help me write a compelling description for my event that will attract more attendees.' },
  { icon: Share2, label: 'Promotion tips', msg: 'What are the best ways to promote my event and get more registrations?' },
  { icon: Wand2, label: 'Pricing strategy', msg: 'What ticket pricing strategy should I use for a 2-day tech conference?' },
];

export default function AiAssistant({ context, onEventDataExtracted }: Props) {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm **Aria**, your AI event assistant ✨\n\nI can help you create events, write descriptions, suggest pricing, and more. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await aiApi.chat(content, context);
      const reply = data.reply as string;

      // Try to extract JSON event data if present
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch && onEventDataExtracted) {
        try {
          const parsed = JSON.parse(jsonMatch[1]) as Record<string, unknown>;
          onEventDataExtracted(parsed);
        } catch {
          // ignore parse error
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```json[\s\S]*?```/g, '<span class="text-xs text-emerald-600 font-medium">✅ Event data extracted — check the form above!</span>')
      .replace(/\n/g, '<br/>');
  };

  if (!isAuthenticated()) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3 text-white shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/60 transition-all duration-300 hover:scale-105 animate-float"
        >
          <Sparkles className="h-5 w-5" strokeWidth={2} />
          <span className="text-sm font-semibold">Aria AI</span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={cn(
          'fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-all duration-300',
          minimized ? 'h-14 w-72' : 'h-[520px] w-80 sm:w-96'
        )}>
          {/* Header */}
          <div className="flex items-center gap-2.5 rounded-t-2xl bg-gradient-to-r from-brand-600 to-violet-600 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Aria</p>
              <p className="text-[10px] text-white/70">AI Event Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 transition-colors"
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', minimized ? 'rotate-180' : '')} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                {/* Quick prompts — only show if just 1 message */}
                {messages.length === 1 && (
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => void sendMessage(q.msg)}
                        className="flex items-start gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-brand-50 hover:border-brand-200 transition-colors group"
                      >
                        <q.icon className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-medium text-slate-600 group-hover:text-brand-700 leading-tight">{q.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-brand-500 to-violet-600'
                        : 'bg-slate-200'
                    )}>
                      {msg.role === 'assistant'
                        ? <Bot className="h-3.5 w-3.5 text-white" />
                        : <User className="h-3.5 w-3.5 text-slate-600" />
                      }
                    </div>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                      msg.role === 'assistant'
                        ? 'bg-slate-100 text-slate-700 rounded-tl-sm'
                        : 'bg-brand-600 text-white rounded-tr-sm'
                    )}>
                      <div
                        dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                      />
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-100 p-3">
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Ask Aria anything..."
                    className="flex-1 resize-none bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none leading-relaxed max-h-20"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!input.trim() || loading}
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-white disabled:opacity-40 transition-opacity hover:shadow-md"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-slate-400">
                  Aria · powered by Gemini
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
