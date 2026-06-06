import { useRef, useState } from 'react';
import { Bot, Send, User, Sparkles, RotateCcw, Copy, Check } from 'lucide-react';

const SUGGESTIONS = [
  'How many projects are pending approval?',
  'List all top-rated approved projects',
  'Which developers are available for freelance?',
  'Show me developers from India',
  'What are the most used tech stacks?',
  'Who joined the platform this month?',
];

function renderMarkdown(text) {
  let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/`([^`]+)`/g, '<code class="bg-accent-light text-accent px-1 py-0.5 rounded text-xs font-mono">$1</code>');
  result = result.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre class="bg-text text-green-400 text-xs font-mono rounded-xl p-3 my-2 overflow-x-auto whitespace-pre-wrap">${code.trim()}</pre>`
  );
  result = result.replace(/\n/g, '<br>');
  return result;
}

function MessageBubble({ msg, onCopy, copied }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isUser ? 'bg-accent text-white' : 'bg-accent-light text-accent'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`max-w-[78%] group ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-white border border-border text-text rounded-tl-sm'
        }`}>
          {isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div
              className="prose-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          )}
          {msg.streaming && (
            <span className="inline-block w-1.5 h-4 bg-accent rounded ml-1 animate-pulse" />
          )}
        </div>
        {!isUser && !msg.streaming && msg.content && (
          <button
            onClick={() => onCopy(msg.content)}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-muted hover:text-text px-1"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminAISection() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { role: 'user', content: userText };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    scrollToBottom();

    setMessages([...history, { role: 'assistant', content: '', streaming: true }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/admin/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            messages: history.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: true };
                return updated;
              });
              scrollToBottom();
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch { /* skip malformed chunks */ }
        }
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullText, streaming: false };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Sorry, something went wrong: ${err.message}`,
          streaming: false,
          error: true,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      scrollToBottom();
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col flex-1 w-full" style={{ minHeight: 0 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-light rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text">AI Assistant</h2>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-text px-3 py-1.5 rounded-lg hover:bg-[#F3F0EB] transition-colors"
          >
            <RotateCcw size={12} /> New chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white border border-border rounded-2xl">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6 py-10 gap-6">
            <div className="w-14 h-14 bg-accent-light rounded-2xl flex items-center justify-center">
              <Bot size={24} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text">Ask me about your platform data</p>
              <p className="text-xs text-muted mt-1">I have access to all projects and developer profiles</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-border hover:border-accent hover:bg-accent-light text-text transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onCopy={handleCopy}
                copied={copied}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="mt-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
          placeholder="Ask about projects, developers, stats…"
          className="flex-1 resize-none px-4 py-3 border border-border rounded-xl text-sm text-text bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition disabled:opacity-50 leading-relaxed"
          style={{ minHeight: '44px', maxHeight: '120px' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 shrink-0 bg-accent hover:bg-[#009688] disabled:bg-border disabled:text-muted text-white rounded-xl flex items-center justify-center transition-colors"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>
      <p className="text-center text-xs text-muted mt-2">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
