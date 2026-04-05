import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../lib/api';
import logo from '../assets/logo.png';

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
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="mb-3 flex h-[30rem] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-4 py-3">
            <div>
              <p className="text-sm font-black text-slate-900">VolunteerHub Chatbot</p>
              <p className="text-xs text-slate-600">Answers questions about this website</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-orange-50"
            >
              Close
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
                {message.text}
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

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full bg-orange-500 px-3 py-3 text-sm font-black text-white shadow-lg transition hover:bg-orange-600"
        aria-label={isOpen ? 'Hide chat' : 'Open chat'}
      >
        {isOpen ? (
          'Hide Chat'
        ) : (
          <img src={logo} alt="VolunteerHub" className="h-8 w-8 rounded-full object-cover" />
        )}
      </button>
    </div>
  );
}
