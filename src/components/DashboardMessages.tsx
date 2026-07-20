'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { DashboardShell } from '@/components/DashboardShell';

interface MessageRow {
  id: number;
  sender: number;
  sender_name: string;
  sender_image: string;
  recipient: number;
  recipient_name: string;
  recipient_image: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

type DashboardRole = 'student' | 'teacher';

export function DashboardMessages({ role }: { role: DashboardRole }) {
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id);
  const [inbox, setInbox] = useState<MessageRow[]>([]);
  const [thread, setThread] = useState<MessageRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState('');

  const conversations = useMemo(() => {
    const byUser = new Map<number, { id: number; name: string; image: string; last: MessageRow }>();
    for (const message of inbox) {
      const mine = message.sender === currentUserId;
      const id = mine ? message.recipient : message.sender;
      byUser.set(id, {
        id,
        name: mine ? message.recipient_name : message.sender_name,
        image: mine ? message.recipient_image : message.sender_image,
        last: message,
      });
    }
    return [...byUser.values()].sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
  }, [inbox, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    void fetch('/api/messages', { cache: 'no-store' }).then(async (response) => {
      const rows: MessageRow[] = response.ok ? await response.json() : [];
      const params = new URLSearchParams(window.location.search);
      const requestedId = Number(params.get('with')) || null;
      const requestedName = params.get('name') || '';
      const last = rows.at(-1);
      const fallbackId = last ? (last.sender === currentUserId ? last.recipient : last.sender) : null;
      const fallbackName = last
        ? (last.sender === currentUserId ? last.recipient_name : last.sender_name)
        : '';
      const nextId = requestedId ?? fallbackId;

      setInbox(rows);
      setSelectedId(nextId);
      setSelectedName(requestedName || fallbackName || (nextId ? 'Conversation' : ''));
      if (nextId) {
        const threadResponse = await fetch(`/api/messages?with=${nextId}`, { cache: 'no-store' });
        setThread(threadResponse.ok ? await threadResponse.json() : []);
      }
      setLoading(false);
    }).catch(() => {
      setError('Messages are temporarily unavailable.');
      setLoading(false);
    });
  }, [currentUserId]);

  const openConversation = async (id: number, name: string) => {
    setSelectedId(id);
    setSelectedName(name);
    setThreadLoading(true);
    setError('');
    const response = await fetch(`/api/messages?with=${id}`, { cache: 'no-store' });
    if (response.ok) setThread(await response.json());
    else setError('Could not load this conversation.');
    setThreadLoading(false);
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedId || !body.trim()) return;
    setError('');
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: selectedId, body: body.trim() }),
    });
    if (!response.ok) {
      setError('Message could not be sent. Please try again.');
      return;
    }
    const created: MessageRow = await response.json();
    setThread((items) => [...items, created]);
    setInbox((items) => [...items, created]);
    setBody('');
  };

  return (
    <DashboardShell role={role}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/40">Inbox</p>
      <h1 className="mb-8 text-3xl font-medium tracking-[-0.03em]">Messages</h1>
      {error && !selectedId && <p className="mb-4 border border-red-700/20 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid min-h-[560px] border border-black/10 md:grid-cols-[280px_1fr]">
        <aside className="border-b border-black/10 md:border-b-0 md:border-r">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => openConversation(conversation.id, conversation.name)}
              className={`flex w-full items-center gap-3 border-b border-black/10 p-4 text-left ${selectedId === conversation.id ? 'bg-[#dceaa8]' : 'hover:bg-black/5'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={conversation.image || '/default-avatar.svg'} alt="" className="h-10 w-10 rounded-full object-cover" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{conversation.name}</span>
                <span className="block truncate text-xs text-black/45">{conversation.last.body}</span>
              </span>
            </button>
          ))}
          {!loading && conversations.length === 0 && <p className="p-5 text-sm text-black/45">No conversations yet.</p>}
        </aside>
        <section className="flex min-w-0 flex-col">
          {selectedId ? (
            <>
              <div className="border-b border-black/10 p-4 font-semibold">{selectedName}</div>
              <div className="flex flex-1 flex-col justify-end gap-3 p-5">
                {threadLoading && <p className="text-center text-sm text-black/40">Loading conversation…</p>}
                {!threadLoading && thread.map((message) => (
                  <div key={message.id} className={`max-w-[80%] px-4 py-3 text-sm ${message.sender === currentUserId ? 'ml-auto bg-[#171813] text-white' : 'bg-black/5'}`}>
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <time className="mt-1 block text-[10px] opacity-45">{new Date(message.created_at).toLocaleString()}</time>
                  </div>
                ))}
                {!threadLoading && thread.length === 0 && <p className="m-auto text-sm text-black/40">Start the conversation.</p>}
              </div>
              <form onSubmit={send} className="border-t border-black/10 p-4">
                {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
                <div className="flex gap-2">
                  <input value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Write a message…" className="min-w-0 flex-1 border border-black/15 bg-transparent px-4 py-3 outline-none focus:border-black/40" />
                  <button className="bg-[#171813] px-4 text-white disabled:opacity-40" disabled={!body.trim()} aria-label="Send message"><Send className="h-4 w-4" /></button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-black/45">Select a conversation or start one from a tutor or student profile.</div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
