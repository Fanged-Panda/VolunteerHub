import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiRequest } from '../lib/api';

const SUGGESTED_QUESTIONS = [
  'How can I apply for an event?',
  'What can a coordinator do in this website?',
  'How do I become an approved coordinator?',
];

function buildInitialMessages() {
  return [
    {
      id: 1,
      role: 'assistant',
      text: 'Hi, I am the VolunteerHub assistant. Ask me anything about how to use this website.',
    },
  ];
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => buildInitialMessages());
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef(null);
  const triggerRef = useRef(null);
  const chatEndRef = useRef(null);

  const canSend = useMemo(() => draft.trim().length > 0 && !sending, [draft, sending]);
  const hasAskedFirstQuestion = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages],
  );

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, messages, sending]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    function updateEyes(clientX, clientY) {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const maxDistance = 5;
      const scale = Math.min(maxDistance, distance) / distance;

      setEyeOffset({
        x: Number((dx * scale).toFixed(2)),
        y: Number((dy * scale).toFixed(2)),
      });
    }

    function handlePointerMove(event) {
      updateEyes(event.clientX, event.clientY);
    }

    window.addEventListener('mousemove', handlePointerMove);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

  async function sendQuestion(text) {
    const question = String(text || '').trim();
    if (!question || sending) return;

    const userMessage = { id: Date.now(), role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setError('');
    setSending(true);

    try {
      const data = await apiRequest('/api/chatbot/ask', {
        method: 'POST',
        token: '',
        body: { question },
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: String(data.answer || '').trim() || 'I could not generate an answer. Please try again.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const nextError = err.message || 'Failed to reach the chatbot service.';
      setError(nextError);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'assistant',
          text: 'Sorry, I could not answer that right now. Please try again in a moment.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSend) return;
    sendQuestion(draft);
  }

  return (
    <div ref={widgetRef} className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6" style={{ viewTransitionName: 'chatbot' }}>
      {isOpen && (
        <div className="mb-3 flex h-[30rem] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">VolunteerHub Chatbot</p>
              <p className="text-xs text-slate-600">Answers questions about this website</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-lg font-black leading-none text-slate-700 hover:bg-orange-100"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-left">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-slate-900 text-white'
                    : 'mr-auto border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
                      li: ({ children }) => <li className="break-words">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap break-words">{message.text}</span>
                )}
              </div>
            ))}

            {sending && (
              <div className="mr-auto max-w-[88%] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!!error && (
            <div className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="border-t border-slate-100 px-3 py-3">
            {!hasAskedFirstQuestion && (
              <div className="mb-2 flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => sendQuestion(question)}
                    disabled={sending}
                    className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about VolunteerHub..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-orange-500 px-3 py-3 text-sm font-black text-white shadow-lg transition hover:bg-orange-600"
          aria-label="Open chat"
        >
          <span className="vh-googly" aria-hidden="true">
            <span className="vh-googly__eye">
              <span
                className="vh-googly__pupil"
                style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
              />
            </span>
            <span className="vh-googly__eye">
              <span
                className="vh-googly__pupil"
                style={{ transform: `translate(${eyeOffset.x * 0.95}px, ${eyeOffset.y * 0.95}px)` }}
              />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
