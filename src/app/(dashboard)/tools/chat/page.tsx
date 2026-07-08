"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [findingTeacher, setFindingTeacher] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Find first teacher to chat with
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const res = await fetch("/api/chat/teachers");
      const { teachers } = await res.json();
      setContacts(teachers ?? []);
      if (teachers?.length) {
        setTeacherId(teachers[0].id);
        setTeacherName(teachers[0].full_name || "Собеседник");
      }
      setFindingTeacher(false);
    })();
  }, []);

  // Load chats for current user
  const loadChats = async () => {
    const res = await fetch("/api/chat");
    const data = await res.json();
    setChats(data.chats ?? []);
  };

  useEffect(() => { if (!findingTeacher) loadChats(); }, [findingTeacher]);

  // Poll messages every 5s
  useEffect(() => {
    if (!selectedChat) return;
    const load = async () => {
      const res = await fetch(`/api/chat?chatId=${selectedChat}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [selectedChat]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openChat = async (chatId: string) => {
    setSelectedChat(chatId);
    setShowList(false);
    await fetch("/api/chat/mark-read", {
      method: "POST",
      body: JSON.stringify({ chatId }),
    });
    loadChats();
  };


  const sendMessage = async () => {
    if (!selectedChat || (!newMessage.trim())) return;
    setSending(true);
    await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ chatId: selectedChat, content: newMessage }),
    });
    setNewMessage("");
    setSending(false);
    // Reload messages
    const res = await fetch(`/api/chat?chatId=${selectedChat}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    loadChats();
  };

  if (findingTeacher) return <div className="text-center py-16 text-muted">Загрузка...</div>;

  if (chats.length === 0 && !selectedChat) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <MessageCircle className="w-12 h-12 text-primary-400 mx-auto mb-2" />
          <p className="text-muted mb-4">У тебя пока нет чатов</p>
          <p className="text-sm text-muted">Выбери собеседника и напиши первое сообщение</p>
        </div>
        <div className="card p-4">
          <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="w-full px-4 py-2 text-sm border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary-400/50" />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {contacts.filter(c => c.id !== userId && (!contactSearch || (c.full_name || "").toLowerCase().includes(contactSearch.toLowerCase()) || (c.email || "").toLowerCase().includes(contactSearch.toLowerCase()))).map(c => (
              <button key={c.id} onClick={async () => {
                setTeacherId(c.id);
                setTeacherName(c.full_name || "Собеседник");
                const res = await fetch("/api/chat/find-or-create", {
                  method: "POST",
                  body: JSON.stringify({ otherUserId: c.id }),
                });
                const { chatId } = await res.json();
                if (chatId) {
                  setSelectedChat(chatId);
                  loadChats();
                }
              }}
                className="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-primary-50 transition-colors flex items-center gap-3 border border-transparent hover:border-border">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs text-primary-500 font-bold">
                    {(c.full_name || "?")[0].toUpperCase()}
                  </div>
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-accent truncate">{c.full_name || "Без имени"}</p>
                  <p className="text-xs text-muted truncate">{c.email || ""}</p>
                </div>
                <span className="badge badge-gray text-[11px] shrink-0">
                  {(c.role === "teacher" || c.role === "admin") ? "Учитель" : "Ученик"}
                </span>
              </button>
            ))}
            {contacts.filter(c => c.id !== userId).length === 0 && (
              <p className="text-sm text-muted text-center py-8">Нет доступных собеседников</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const selected = chats.find(c => c.id === selectedChat);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Chat list */}
      <div className={`${showList ? "flex" : "hidden"} lg:flex w-full lg:w-72 shrink-0 card overflow-y-auto flex-col`}>
        <div className="p-3 border-b border-black/5 shrink-0 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-accent">Чаты</h2>
          <button onClick={() => setShowNewChat(!showNewChat)}
            className="text-xs font-semibold text-primary-500 transition-colors">
            + Новый чат
          </button>
        </div>

        {/* Contact picker */}
        {showNewChat && (
          <div className="p-2 border-b border-black/5 bg-primary-50/50 space-y-1">
            <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
              placeholder="Поиск по имени или email..."
              className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/50 mb-1" />
            {contacts.filter(c => c.id !== userId && (!contactSearch || (c.full_name || "").toLowerCase().includes(contactSearch.toLowerCase()) || (c.email || "").toLowerCase().includes(contactSearch.toLowerCase()))).map(c => (
              <button key={c.id} onClick={async () => {
                setShowNewChat(false);
                setTeacherId(c.id);
                setTeacherName(c.full_name || "Собеседник");
                const res = await fetch("/api/chat/find-or-create", {
                  method: "POST",
                  body: JSON.stringify({ otherUserId: c.id }),
                });
                const { chatId } = await res.json();
                if (chatId) {
                  setSelectedChat(chatId);
                  loadChats();
                }
              }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white transition-colors flex items-center gap-2">
                <div className="relative shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] text-primary-500 font-bold">
                    {(c.full_name || "?")[0].toUpperCase()}
                  </div>
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-green-500" />}
                </div>
                <span className="truncate">{c.full_name || "Без имени"}</span>
                <span className="text-[10px] text-muted ml-auto shrink-0">
                  {(c.role === "teacher" || c.role === "admin") ? "Учитель" : "Ученик"}
                </span>
              </button>
            ))}
          </div>
        )}

        {chats.length === 0 ? (
          <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            <p className="text-xs text-muted px-2 mb-1">Выбери собеседника:</p>
            {contacts.filter(c => c.id !== userId).map(c => (
              <button key={c.id} onClick={async () => {
                setTeacherId(c.id);
                setTeacherName(c.full_name || "Собеседник");
                const res = await fetch("/api/chat/find-or-create", {
                  method: "POST",
                  body: JSON.stringify({ otherUserId: c.id }),
                });
                const { chatId } = await res.json();
                if (chatId) {
                  setSelectedChat(chatId);
                  loadChats();
                }
              }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary-50 transition-colors flex items-center gap-2">
                <div className="relative shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-[10px] text-primary-500 font-bold">
                    {(c.full_name || "?")[0].toUpperCase()}
                  </div>
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-green-500" />}
                </div>
                <span className="truncate">{c.full_name || "Без имени"}</span>
                <span className="text-[10px] text-muted ml-auto shrink-0">
                  {(c.role === "teacher" || c.role === "admin") ? "Учитель" : "Ученик"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
                {chats.map(chat => {
              const other = chat.student_id === userId ? chat.teacher : chat.student;
              const last = chat.last_message;
              return (
                <button key={chat.id} onClick={() => openChat(chat.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-primary-50 hover:bg-primary-50 transition-colors ${selectedChat === chat.id ? "bg-primary-50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs text-primary-500 font-bold">
                          {(other?.full_name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      {other?.last_seen && (Date.now() - new Date(other.last_seen).getTime()) < 120000 && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-accent truncate">
                        {other?.full_name || "Собеседник"}
                        {(other?.role === "teacher" || other?.role === "admin") && <span className="ml-1.5 badge badge-orange text-[10px]">Учитель</span>}
                      </p>
                      {last && <p className="text-xs text-muted truncate">{last.content || "📎 Файл"}</p>}
                    </div>
                    {chat.unread_count > 0 && (
                      <span className="w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full shrink-0">
                        {chat.unread_count > 9 ? "9+" : chat.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className={`${!showList ? "flex" : "hidden"} lg:flex flex-1 card flex-col`}>
        {selected ? (
          <>
            <div className="p-3 border-b border-black/5 bg-primary-50/50 rounded-t-xl flex items-center gap-2">
              <button onClick={() => setShowList(true)} className="lg:hidden p-1 text-muted hover:text-primary-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <p className="font-medium text-sm text-accent">
                {(() => {
                  const other = selected.student_id === userId ? selected.teacher : selected.student;
                  return <>                  {other?.full_name || "Собеседник"} {(other?.role === "teacher" || other?.role === "admin") && <span className="ml-1.5 badge badge-orange text-[10px]">Учитель</span>}</>;
                })()}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => {
                const isMe = m.sender_id === userId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${isMe ? "bg-primary-500 text-white" : "bg-primary-50 text-accent"}`}>
                      {!isMe && (m.sender?.role === "teacher" || m.sender?.role === "admin") && (
                        <span className="text-[10px] font-medium text-primary-400 block mb-0.5">
                          {m.sender.full_name}
                          <span className="ml-1 badge badge-orange text-[9px]">Учитель</span>
                        </span>
                      )}
                      {m.content && <p>{m.content}</p>}
                      {m.file_url && <a href={m.file_url} target="_blank" className="underline text-xs">📎 Файл</a>}
                      <p className={`text-[10px] mt-1 ${isMe ? "text-primary-200" : "text-muted"}`}>
                        {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Напиши сообщение..." className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all" />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                className="btn-gradient px-4 py-2 text-sm disabled:opacity-50 transition-all duration-200">
                {sending ? "..." : "→"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            Выбери чат
          </div>
        )}
      </div>
    </div>
  );
}
