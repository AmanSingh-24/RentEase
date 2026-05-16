"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { 
  Send, Loader2, Megaphone, ShieldCheck, MessageSquare 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TenantMessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        
        if (!userRes.ok || !userData.user || !userData.user.propertyId) {
          setLoading(false);
          return;
        }
        setUser(userData.user);

        const historyRes = await fetch(`/api/messages/history?propertyId=${userData.user.propertyId}`);
        const historyData = await historyRes.json();
        
        if (historyRes.ok && historyData.history) {
          setMessages(historyData.history.filter((m: any) => m.messageType === "direct"));
          setBroadcasts(historyData.history.filter((m: any) => m.messageType === "broadcast").reverse());
        }

        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
          withCredentials: true
        });

        socketRef.current.emit("join_property_room", { propertyId: userData.user.propertyId });
        
        const propertyRes = await fetch(`/api/properties/get-by-tenant?tenantId=${userData.user._id}`);
        const propertyData = await propertyRes.json();
        if (propertyRes.ok && propertyData.property) {
          setOwnerId(propertyData.property.ownerId);
          socketRef.current.emit("join_broadcast_channel", { ownerId: propertyData.property.ownerId });
        }

        // 🛡️ DEDUPLICATION SHIELD: Rejects existing message updates
        socketRef.current.on("receive_message", (newMessage: any) => {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
        });

        // 🛡️ DEDUPLICATION SHIELD: Rejects existing broadcast updates
        socketRef.current.on("receive_broadcast", (newBroadcast: any) => {
          setBroadcasts((prev) => {
            if (prev.some((b) => b._id === newBroadcast._id || b.messageText === newBroadcast.messageText)) return prev;
            return [newBroadcast, ...prev];
          });
        });

      } catch (err) {
        console.error("Chat initialization failure:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeChatSession();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !ownerId) return;

    socketRef.current.emit("send_direct_message", {
      senderId: user._id,
      receiverId: ownerId, 
      propertyId: user.propertyId,
      messageText: inputText
    });

    setInputText("");
  };

  if (loading) return <div className="h-[80vh] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40} /><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Opening Secure Comms...</p></div>;
  if (!user || !user.propertyId) return <div className="p-12 text-center text-sm font-bold text-gray-400 uppercase italic">No active tenancy structure found. Comms terminal disabled.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-10 max-w-7xl mx-auto h-[calc(100vh-40px)] overflow-hidden">
      
      {/* COLUMN A: NOTICES PANEL FEED */}
      <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner"><Megaphone size={18}/></div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-800">Owner Broadcasts</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Building Announcements</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
          <AnimatePresence>
            {broadcasts.map((b, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-gradient-to-br from-orange-50/40 to-orange-50/10 border border-orange-100/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-full">Official Notice</span>
                  <span className="text-[9px] font-bold text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">{b.messageText}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          {broadcasts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-300 py-20">
              <ShieldCheck size={32} className="mb-2 opacity-40" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Active Bulletins</p>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN B: 1-TO-1 CHAT SCREEN VIEWPORT */}
      <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden relative">
        <header className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">LL</div>
            <div>
              <h3 className="font-black text-base text-[#1F2937] tracking-tight">Property Management Terminal</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Secured Line Online
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-gray-50/20 scrollbar-none max-h-[calc(100vh-280px)]">
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user._id;
            return (
              <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
                <div className={`max-w-[70%] p-5 rounded-[24px] shadow-sm relative ${
                  isMe ? "bg-[#1F2937] text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                }`}>
                  <p className="text-sm font-medium leading-relaxed break-words">{msg.messageText}</p>
                  <span className={`text-[8px] font-bold block mt-2 text-right uppercase tracking-widest ${isMe ? "text-gray-400" : "text-gray-300"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-50 bg-white flex gap-4 items-center absolute bottom-0 inset-x-0">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 p-5 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-100 outline-none rounded-2xl font-bold text-sm text-[#1F2937] transition-all shadow-inner"
          />
          <button type="submit" disabled={!inputText.trim()} className="p-5 bg-blue-600 text-white rounded-2xl hover:bg-black transition-transform disabled:opacity-20 active:scale-95 flex items-center justify-center"><Send size={18} /></button>
        </form>

      </div>
    </div>
  );
}