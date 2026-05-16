"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { 
  Send, Loader2, Megaphone, User, Building, 
  ChevronRight, MessageSquare, X, History, Radio 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerMessagesPage() {
  const [owner, setOwner] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [broadcastLog, setBroadcastLog] = useState<any[]>([]); // Past announcements state
  const [leftTab, setLeftTab] = useState<"chats" | "history">("chats"); // Sidebar tab navigation switcher
  const [activeChat, setActiveChat] = useState<any>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null); // Details view context toggle
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [unreadRooms, setUnreadRooms] = useState<string[]>([]);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const socketRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<any>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchBroadcastHistory = async () => {
    try {
      const res = await fetch("/api/messages/broadcasts");
      const data = await res.json();
      if (res.ok && data.broadcasts) {
        setBroadcastLog(data.broadcasts);
      }
    } catch (err) {
      console.error("Failed fetching broadcast logs:", err);
    }
  };

  useEffect(() => {
    const initializeOwnerSuite = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        if (!userRes.ok || !userData.user) return;
        setOwner(userData.user);

        const rosterRes = await fetch("/api/properties/active-tenants");
        const rosterData = await rosterRes.json();
        
        if (rosterRes.ok && rosterData.roster) {
          setRoster(rosterData.roster);
          await fetchBroadcastHistory(); // Hydrate past broadcast records on mount

          socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
            withCredentials: true
          });

          rosterData.roster.forEach((node: any) => {
            if (node.propertyId?._id) {
              socketRef.current.emit("join_property_room", { propertyId: node.propertyId._id });
            }
          });

          // 🛡️ DEDUPLICATION SHIELD: Rejects duplicate socket payloads
          socketRef.current.on("receive_message", (newMessage: any) => {
            if (activeChatRef.current && activeChatRef.current.propertyId._id === newMessage.propertyId) {
              setMessages((prev) => {
                if (prev.some((m) => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
              });
            } else {
              setUnreadRooms((prev) => [...new Set([...prev, newMessage.propertyId])]);
            }
          });
        }
      } catch (err) {
        console.error("Owner chat suite boot crash:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeOwnerSuite();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const selectConversation = async (node: any) => {
    setSelectedBroadcast(null); // Close broadcast view if open
    setActiveChat(node);
    activeChatRef.current = node;
    setMessages([]);
    setUnreadRooms((prev) => prev.filter((id) => id !== node.propertyId._id));

    try {
      const historyRes = await fetch(`/api/messages/history?propertyId=${node.propertyId._id}`);
      const historyData = await historyRes.json();
      if (historyRes.ok && historyData.history) {
        setMessages(historyData.history.filter((m: any) => m.messageType === "direct"));
      }
    } catch (err) {
      console.error("Failed pulling message timeline history:", err);
    }
  };

  const closeActiveWorkspace = () => {
    setActiveChat(null);
    activeChatRef.current = null;
    setSelectedBroadcast(null);
    setMessages([]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !owner) return;

    socketRef.current.emit("send_direct_message", {
      senderId: owner._id,
      receiverId: activeChat.tenantId._id,
      propertyId: activeChat.propertyId._id,
      messageText: inputText
    });

    setInputText("");
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() || roster.length === 0) return;
    setBroadcasting(true);

    const targetPropertyIds = roster.map((r: any) => r.propertyId._id).filter(Boolean);

    socketRef.current.emit("send_owner_broadcast", {
      ownerId: owner._id,
      propertyIds: targetPropertyIds,
      messageText: broadcastText
    });

    setBroadcastText("");
    setBroadcasting(false);
    
    // Smooth delay for database write before refreshing history logs
    setTimeout(async () => {
      await fetchBroadcastHistory();
      alert("📢 Announcement broadcasted to all active units and added to logs.");
    }, 800);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-10 max-w-7xl mx-auto h-[calc(100vh-8px)] overflow-hidden relative">
      
      {/* LEFT COLUMN: CHAT PANEL SYSTEM FEEDS */}
      <div className="lg:col-span-1 flex flex-col h-full gap-6 overflow-hidden">
        
        <div className="flex-1 bg-white rounded-[40px] border border-gray-100 p-6 flex flex-col overflow-hidden shadow-sm">
          
          {/* WHATSAPP-STYLE TAB HEADERS CONTROL ENGINE */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-50 rounded-2xl mb-6">
            <button 
              onClick={() => { setLeftTab("chats"); closeActiveWorkspace(); }}
              className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                leftTab === "chats" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <MessageSquare size={14}/> Direct Chats
            </button>
            <button 
              onClick={() => { setLeftTab("history"); closeActiveWorkspace(); }}
              className={`py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                leftTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <History size={14}/> Broadcast Logs
            </button>
          </div>

          {/* DYNAMIC LIST VIEWER INTERFACES */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
            <AnimatePresence mode="wait">
              {leftTab === "chats" ? (
                <motion.div key="chats-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {roster.map((node, i) => {
                    const isSelected = activeChat?.propertyId._id === node.propertyId._id;
                    const hasUnread = unreadRooms.includes(node.propertyId._id);

                    return (
                      <div 
                        key={i} 
                        onClick={() => selectConversation(node)}
                        className={`p-5 rounded-[24px] border transition-all duration-200 cursor-pointer flex items-center justify-between group relative ${
                          isSelected ? 'bg-gray-50 border-gray-100 shadow-inner scale-[0.99]' : 'bg-white border-transparent hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 font-black rounded-xl flex items-center justify-center text-xs uppercase">
                            {node.tenantId?.name?.charAt(0) || "T"}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-gray-800 uppercase tracking-tight flex items-center gap-2">
                              {node.tenantId?.name}
                              {hasUnread && <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm" />}
                            </h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 flex items-center gap-1">
                              <Building size={11}/> {node.propertyId?.address?.split(',')[0]}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`text-gray-300 transition-transform ${isSelected ? 'translate-x-1 text-blue-600' : 'group-hover:translate-x-0.5'}`} />
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div key="history-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {broadcastLog.map((b, i) => {
                    const isSelected = selectedBroadcast?._id === b._id;
                    return (
                      <div 
                        key={i}
                        onClick={() => { setActiveChat(null); setSelectedBroadcast(b); }}
                        className={`p-5 rounded-[24px] border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected ? "bg-orange-50/50 border-orange-100 shadow-inner" : "bg-white border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-full flex items-center gap-1"><Radio size={8}/> Broadcasted</span>
                          <span className="text-[9px] font-bold text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-700 line-clamp-2 leading-relaxed">{b.messageText}</p>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FIXED BOTTOM MASS BROADCAST INTERACTIVE DECK */}
        <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
             <Megaphone className="text-blue-500" size={16}/>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mass Broadcast Terminal</span>
          </div>
          <form onSubmit={handleBroadcastSubmit} className="space-y-3">
             <input 
               type="text"
               value={broadcastText}
               onChange={(e) => setBroadcastText(e.target.value)}
               placeholder="Type global bulletin update..."
               className="w-full p-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-100 rounded-xl outline-none font-medium text-xs shadow-inner"
             />
             <button 
               type="submit"
               disabled={broadcasting || !broadcastText.trim() || roster.length === 0}
               className="w-full py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-md"
             >
                {broadcasting ? "Transmitting..." : "Dispatch Broadcast Alert"}
             </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTION THREAD SYSTEM VIEWPORTS */}
      <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 h-full flex flex-col overflow-hidden relative shadow-sm">
        {activeChat ? (
          <>
            <header className="p-6 bg-gray-50/30 border-b border-gray-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1F2937] text-white rounded-2xl flex items-center justify-center font-black text-sm uppercase">
                    {activeChat.tenantId?.name?.charAt(0) || "T"}
                  </div>
                  <div>
                     <h3 className="font-black text-base text-[#1F2937] uppercase tracking-tight">{activeChat.tenantId?.name}</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{activeChat.propertyId?.address}</p>
                  </div>
               </div>
               <button onClick={closeActiveWorkspace} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-full border shadow-sm transition-all"><X size={18} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 max-h-[calc(100vh-280px)] scrollbar-none bg-gray-50/10">
               {messages.map((m, idx) => {
                 const isMe = m.senderId === owner._id;
                 return (
                  <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
                     <div className={`max-w-[70%] p-5 rounded-[24px] shadow-sm relative ${
                       isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                     }`}>
                        <p className="text-sm font-medium leading-relaxed break-words">{m.messageText}</p>
                        <span className="text-[8px] font-black block mt-2 text-right uppercase tracking-wider opacity-40">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                  </div>
                 )
               })}
               <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="p-6 border-t border-gray-50 bg-white flex gap-4 absolute bottom-0 inset-x-0">
               <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="Type your outbound message reply..."
                 className="flex-1 p-5 bg-gray-50 rounded-2xl outline-none text-sm font-bold border border-transparent focus:bg-white focus:border-blue-100 shadow-inner"
               />
               <button type="submit" disabled={!inputText.trim()} className="p-5 bg-[#1F2937] text-white rounded-2xl hover:bg-black disabled:opacity-20 shadow-md flex items-center justify-center"><Send size={18}/></button>
            </form>
          </>
        ) : selectedBroadcast ? (
          /* 📢 DISPLAY TERMINAL PANEL: PAST SENT BROADCAST EXPANSION LOG DETAILS */
          <div className="p-12 space-y-6 h-full bg-gray-50/10 overflow-y-auto relative animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner"><Megaphone size={20}/></div>
                <div>
                  <h3 className="font-black text-lg text-gray-800 tracking-tight">Broadcast Delivery Report</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Dispatched: {new Date(selectedBroadcast.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={closeActiveWorkspace} className="p-3 bg-white text-gray-400 hover:text-black rounded-full border shadow-sm transition-all"><X size={16}/></button>
            </div>
            <div className="p-8 bg-white rounded-[28px] border border-gray-100 shadow-sm space-y-4">
               <span className="text-[9px] font-black uppercase text-orange-600 tracking-widest block">Message Payload Content</span>
               <p className="text-sm font-bold text-gray-700 leading-relaxed break-words bg-gray-50/50 p-6 rounded-2xl border border-gray-50">{selectedBroadcast.messageText}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-300">
            <MessageSquare size={48} className="mb-4 opacity-30 animate-pulse"/>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-1">No Active Conversational Feed</h4>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Select an active context item card link from the left tracker column map.</p>
          </div>
        )}
      </div>
    </div>
  );
}