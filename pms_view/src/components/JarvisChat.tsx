'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '@/stores';

const SUGGESTED_QUERIES = [
  'Why did PMS prices spike in Lagos last week?',
  'Which terminals are most critical to supply chain?',
  'Show me all operational refineries',
  'What happens if Apapa terminal goes offline?',
];

export default function JarvisChat() {
  const { chat_open, toggle_chat, chat_messages, add_chat_message, ai_thinking, set_ai_thinking, nodes, flows, set_camera, set_ai_focus_nodes } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat_messages]);

  const handleSend = async (query?: string) => {
    const text = query || input.trim();
    if (!text || ai_thinking) return;
    setInput('');

    add_chat_message({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    });

    set_ai_thinking(true);

    try {
      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();

      if (data?.text) {
        add_chat_message({ id: (Date.now() + 1).toString(), role: 'assistant', content: data.text, timestamp: new Date().toISOString() });
      }

      if (Array.isArray(data?.actions)) {
        for (const action of data.actions) {
          if (action.type === 'zoom') {
            set_camera({ longitude: action.longitude, latitude: action.latitude, zoom: action.zoom });
          }
          if (action.type === 'message') {
            add_chat_message({ id: (Date.now() + 2).toString(), role: 'assistant', content: action.text, timestamp: new Date().toISOString() });
          }
          if (action.type === 'focus_nodes' && Array.isArray(action.ids)) {
            set_ai_focus_nodes(action.ids);
          }
        }
      }
    } catch (e) {
      add_chat_message({ id: (Date.now() + 3).toString(), role: 'assistant', content: 'Jarvis failed to respond (local stub).', timestamp: new Date().toISOString() });
    } finally {
      set_ai_thinking(false);
    }
  };

  return (
    <AnimatePresence>
      {chat_open && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute bottom-4 right-4 w-[420px] z-40 flex flex-col rounded-lg overflow-hidden"
          style={{
            height: '520px',
            background: 'linear-gradient(135deg, rgba(13,17,23,0.92) 0%, rgba(8,11,30,0.95) 100%)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(157,78,221,0.25)',
            boxShadow: '0 16px 48px rgba(157,78,221,0.2), inset 0 0 20px rgba(157,78,221,0.05)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(157,78,221,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#9D4EDD20] border border-[#9D4EDD40] flex items-center justify-center">
                <Sparkles size={12} className="text-[#E0AAFF]" />
              </div>
              <div>
                <div className="text-[12px] font-bold font-mono text-[#E0AAFF]">Jarvis</div>
                <div className="text-[9px] font-mono text-[#696969]">Supply Chain Intelligence</div>
              </div>
            </div>
            <button onClick={toggle_chat} className="text-[#696969] hover:text-[#E8E8E8] transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {chat_messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-mono text-[#696969] leading-relaxed">
                  Ask me anything about Nigeria's petrochemical supply chain. I can analyze patterns, explain anomalies, and highlight relevant facilities on the map.
                </p>
                <div className="space-y-1.5">
                  {SUGGESTED_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-[10px] font-mono text-[#9D4EDD] hover:text-[#E0AAFF] px-2.5 py-1.5 rounded border border-[#9D4EDD20] hover:border-[#9D4EDD40] hover:bg-[#9D4EDD08] transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat_messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded text-[11px] font-mono leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === 'user'
                      ? { background: 'rgba(0,217,255,0.1)', color: '#E8E8E8', border: '1px solid rgba(0,217,255,0.2)' }
                      : { background: 'rgba(157,78,221,0.08)', color: '#E8E8E8', border: '1px solid rgba(157,78,221,0.15)' }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {ai_thinking && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded flex items-center gap-2"
                  style={{ background: 'rgba(157,78,221,0.08)', border: '1px solid rgba(157,78,221,0.15)' }}
                >
                  <Loader2 size={11} className="text-[#9D4EDD] animate-spin" />
                  <span className="text-[10px] font-mono text-[#9D4EDD]">Analyzing supply chain data...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(157,78,221,0.15)' }}>
            <div
              className="flex items-center gap-2 rounded px-3 py-2"
              style={{ background: 'rgba(157,78,221,0.05)', border: '1px solid rgba(157,78,221,0.2)' }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about the supply chain..."
                className="flex-1 bg-transparent text-[11px] font-mono text-[#E8E8E8] placeholder-[#696969] outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || ai_thinking}
                className="text-[#9D4EDD] hover:text-[#E0AAFF] disabled:opacity-30 transition-colors"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
