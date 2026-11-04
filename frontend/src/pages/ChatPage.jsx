import { useState, useEffect, useRef, useCallback } from "react";
import { Send, CheckCheck, Search, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Fetch or initialize chat rooms
  const initRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      let { data: existingRooms } = await supabase
        .from("chat_rooms")
        .select("*, profiles:created_by(full_name, avatar_url, role)")
        .order("created_at", { ascending: false });

      if (!existingRooms || existingRooms.length === 0) {
        // Create initial default chat room if user logged in
        if (user?.id) {
          const { data: newRoom } = await supabase
            .from("chat_rooms")
            .insert([
              {
                created_by: user.id,
                room_name: "PropVerse Community & Property Chat",
              },
            ])
            .select("*, profiles:created_by(full_name, avatar_url, role)")
            .single();

          if (newRoom) {
            existingRooms = [newRoom];
            // Add user as chat member
            await supabase.from("chat_members").insert([{ room_id: newRoom.id, user_id: user.id }]);
          }
        }
      }

      setRooms(existingRooms || []);
      if (existingRooms && existingRooms.length > 0) {
        setActiveRoom(existingRooms[0]);
      }
    } catch (err) {
      console.error("Failed to load chat rooms:", err);
    } finally {
      setLoadingRooms(false);
    }
  }, [user?.id]);

  // 2. Fetch messages for active room
  const fetchMessages = async (roomId) => {
    if (!roomId) return;
    try {
      const { data } = await supabase
        .from("messages")
        .select("*, sender:sender_id(full_name, avatar_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  useEffect(() => {
    initRooms();
  }, [initRooms]);

  useEffect(() => {
    if (!activeRoom?.id) return;
    fetchMessages(activeRoom.id);

    // Realtime Supabase Channel for Messages
    const channel = supabase
      .channel(`realtime:messages:${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        async (payload) => {
          // Fetch sender info for the new message
          const { data: sender } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.sender_id)
            .single();

          const fullMsg = { ...payload.new, sender };
          setMessages((prev) => [...prev, fullMsg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom?.id]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMsg.trim() || !activeRoom?.id || !user?.id) return;
    setSending(true);

    const messageText = inputMsg.trim();
    setInputMsg("");

    try {
      const { error } = await supabase.from("messages").insert([
        {
          room_id: activeRoom.id,
          sender_id: user.id,
          content: messageText,
          message_type: "text",
        },
      ]);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-7rem)]">
        <Card hover={false} className="h-full overflow-hidden flex">
          {/* Conversation Sidebar */}
          <div className="w-80 border-r border-[var(--border-primary)] flex flex-col bg-[var(--bg-surface)] shrink-0">
            <div className="p-4 border-b border-[var(--border-secondary)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Real-Time Chats</h2>
              <Input icon={Search} placeholder="Search channels..." className="h-9 text-xs" />
            </div>
            
            {loadingRooms ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
                <Loader2 size={24} className="animate-spin text-primary-600 mx-auto mb-2" />
                Connecting to Supabase...
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                No active chat channels yet.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-secondary)]">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      activeRoom?.id === room.id ? "bg-primary-50 dark:bg-primary-900/20" : "hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {room.room_name?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {room.room_name || "General Chat"}
                      </p>
                      <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                        Created by {room.profiles?.full_name || "User"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Chat Thread */}
          <div className="flex-1 flex flex-col bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="p-4 bg-[var(--bg-surface)] border-b border-[var(--border-primary)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
                  {activeRoom?.room_name?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{activeRoom?.room_name || "Real-Time Room"}</h3>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <Sparkles size={10} /> Supabase Realtime Active
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-xs text-[var(--text-tertiary)]">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-40" />
                  No messages in this chat channel yet. Send a message below to start chatting!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  const senderName = m.sender?.full_name || (isMe ? "You" : "User");
                  const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-primary-600 text-white rounded-br-none"
                            : "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-bl-none"
                        }`}
                      >
                        {!isMe && <p className="text-[10px] font-bold text-primary-500 mb-1">{senderName}</p>}
                        <p>{m.content}</p>
                        <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? "text-white/70" : "text-[var(--text-tertiary)]"}`}>
                          <span>{time}</span>
                          {isMe && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-primary)] flex items-center gap-2">
              <input
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder={user ? "Type your message..." : "Please log in to chat..."}
                disabled={!user || sending}
                className="flex-1 h-10 px-4 rounded-xl bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-50"
              />
              <Button type="submit" variant="gradient" size="sm" disabled={!user || sending || !inputMsg.trim()}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
