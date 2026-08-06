"use client";

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { 
  Send, Loader2, Megaphone, User, Building, 
  ChevronRight, MessageSquare, X, History, Radio, ArrowLeft
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
    }, 800);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-neutral-950" size={32} />
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Hydrating Inbox Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-white rounded-2xl border border-neutral-200/80 h-[calc(100vh-150px)] overflow-hidden shadow-2xs">
      
      {/* ── LEFT COLUMN: Conversational Feed / Broadcasting ────────────────── */}
      <div className={`w-full lg:w-96 flex flex-col border-r border-neutral-200/80 bg-white ${activeChat || selectedBroadcast ? "hidden lg:flex" : "flex"}`}>
        
        {/* WhatsApp-Style Toggle tabs */}
        <div className="p-4 border-b border-neutral-100 space-y-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 rounded-xl">
            <button 
              onClick={() => { setLeftTab("chats"); closeActiveWorkspace(); }}
              className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === "chats" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <MessageSquare size={13}/> Direct Inbox
            </button>
            <button 
              onClick={() => { setLeftTab("history"); closeActiveWorkspace(); }}
              className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leftTab === "history" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <History size={13}/> Sent Alerts
            </button>
          </div>
        </div>

        {/* Dynamic List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 pr-1">
          <AnimatePresence mode="wait">
            {leftTab === "chats" ? (
              <motion.div key="chats-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {roster.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400">
                    <User size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No active tenancies linked</p>
                  </div>
                ) : (
                  roster.map((node, i) => {
                    const isSelected = activeChat?.propertyId._id === node.propertyId._id;
                    const hasUnread = unreadRooms.includes(node.propertyId._id);

                    return (
                      <button
                        key={i} 
                        onClick={() => selectConversation(node)}
                        className={`w-full p-4 flex items-center justify-between text-left transition-all border-l-4 cursor-pointer ${
                          isSelected 
                            ? 'bg-neutral-50 border-neutral-950 font-bold' 
                            : 'border-transparent hover:bg-neutral-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-neutral-900 text-white font-black rounded-lg flex items-center justify-center text-xs uppercase shrink-0">
                            {node.tenantId?.name?.charAt(0) || "T"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs text-neutral-900 flex items-center gap-1.5 leading-snug">
                              <span className="truncate">{node.tenantId?.name}</span>
                              {hasUnread && <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shrink-0" />}
                            </h4>
                            <p className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1 mt-0.5 truncate">
                              <Building size={10} className="shrink-0" /> {node.propertyId?.address}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className={`text-neutral-300 ${isSelected ? "text-neutral-950 translate-x-0.5" : ""}`} />
                      </button>
                    );
                  })
                )}
              </motion.div>
            ) : (
              <motion.div key="history-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-2">
                {broadcastLog.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400">
                    <Megaphone size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">No broadcast alerts dispatched</p>
                  </div>
                ) : (
                  broadcastLog.map((b, i) => {
                    const isSelected = selectedBroadcast?._id === b._id;
                    return (
                      <button 
                        key={i}
                        onClick={() => { setActiveChat(null); setSelectedBroadcast(b); }}
                        className={`w-full p-4 rounded-xl border transition-all text-left flex flex-col gap-2 cursor-pointer ${
                          isSelected ? "bg-neutral-50 border-neutral-300" : "bg-white border-neutral-200/60 hover:bg-neutral-50/50"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[8px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1"><Radio size={8}/> Broadcasted</span>
                          <span className="text-[9px] font-bold text-neutral-400">{new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        </div>
                        <p className="text-xs font-bold text-neutral-700 line-clamp-2 leading-relaxed">{b.messageText}</p>
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Bulletin Alert Drawer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-1.5 mb-3">
             <Megaphone className="text-neutral-500" size={14}/>
             <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Tenant Broadcast Terminal</span>
          </div>
          <form onSubmit={handleBroadcastSubmit} className="space-y-2">
             <input 
               type="text"
               value={broadcastText}
               onChange={(e) => setBroadcastText(e.target.value)}
               placeholder="Type global bulletin update..."
               className="w-full px-3 py-2.5 bg-white border border-neutral-200 focus:border-neutral-900 rounded-xl outline-none font-semibold text-xs transition-all shadow-3xs"
             />
             <button 
               type="submit"
               disabled={broadcasting || !broadcastText.trim() || roster.length === 0}
               className="w-full py-2.5 bg-neutral-950 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
             >
                {broadcasting ? "Dispatching..." : "Send Global Broadcast Alert"}
             </button>
          </form>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Interactive Conversation Threads ────────────────── */}
      <div className={`flex-1 bg-white h-full flex flex-col overflow-hidden relative ${!activeChat && !selectedBroadcast ? "hidden lg:flex" : "flex"}`}>
        {activeChat ? (
          <div className="flex flex-col h-full justify-between">
            {/* Header info */}
            <header className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/40">
               <div className="flex items-center gap-3">
                  {/* Mobile Back button */}
                  <button 
                    onClick={closeActiveWorkspace}
                    className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 lg:hidden cursor-pointer mr-1"
                    title="Back to inbox"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className="w-10 h-10 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-black text-sm uppercase shrink-0">
                    {activeChat.tenantId?.name?.charAt(0) || "T"}
                  </div>
                  <div className="min-w-0">
                     <h3 className="font-extrabold text-xs text-neutral-950 truncate leading-snug">{activeChat.tenantId?.name}</h3>
                     <p className="text-[10px] text-neutral-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                       <Building size={10} className="shrink-0" /> {activeChat.propertyId?.address}
                     </p>
                  </div>
               </div>
               
               <button 
                 onClick={closeActiveWorkspace} 
                 className="p-2 bg-white text-neutral-400 hover:text-neutral-800 rounded-xl border border-neutral-200 shadow-3xs transition-all cursor-pointer hidden lg:block"
                 title="Close Chat"
               >
                 <X size={15} />
               </button>
            </header>

            {/* Conversation Log messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[calc(100vh-320px)] bg-neutral-50/20">
               {messages.map((m, idx) => {
                 const isMe = m.senderId === owner._id;
                 return (
                  <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
                     <div className={`max-w-[70%] p-4 rounded-2xl shadow-3xs relative leading-relaxed ${
                       isMe 
                         ? "bg-neutral-950 text-white rounded-tr-xs" 
                         : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-xs"
                     }`}>
                        <p className="text-xs font-semibold leading-normal break-words">{m.messageText}</p>
                        <span className="text-[8px] font-bold block mt-1.5 text-right uppercase tracking-wide opacity-50">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                  </div>
                 )
               })}
               <div ref={endRef} />
            </div>

            {/* Bottom input area */}
            <form onSubmit={handleSend} className="p-4 border-t border-neutral-100 bg-white flex gap-3">
               <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="Type your outbound message reply..."
                 className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-xs font-semibold focus:bg-white focus:border-neutral-950 shadow-3xs"
               />
               <button 
                 type="submit" 
                 disabled={!inputText.trim()} 
                 className="p-3 bg-neutral-950 text-white rounded-xl hover:bg-black disabled:opacity-20 shadow-xs flex items-center justify-center cursor-pointer shrink-0 transition-colors"
               >
                 <Send size={15}/>
               </button>
            </form>
          </div>
        ) : selectedBroadcast ? (
          /* Broadcast Delivery View */
          <div className="p-8 space-y-6 h-full bg-neutral-50/10 overflow-y-auto relative animate-in fade-in duration-200">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                {/* Mobile Back button */}
                <button 
                  onClick={closeActiveWorkspace}
                  className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 lg:hidden cursor-pointer mr-1"
                  title="Back to sent alerts"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-3xs"><Megaphone size={16}/></div>
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900 tracking-tight">Broadcast Delivery Report</h3>
                  <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Dispatched: {new Date(selectedBroadcast.createdAt).toLocaleString("en-IN")}</p>
                </div>
              </div>
              
              <button 
                onClick={closeActiveWorkspace} 
                className="p-2 bg-white text-neutral-400 hover:text-neutral-800 rounded-xl border border-neutral-200 shadow-3xs transition-all cursor-pointer hidden lg:block"
                title="Close Report"
              >
                <X size={15}/>
              </button>
            </div>
            
            <div className="p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-3xs space-y-4">
               <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider block">Message Payload Content</span>
               <p className="text-xs font-semibold text-neutral-700 leading-relaxed break-words bg-neutral-50/50 p-5 rounded-xl border border-neutral-200/40">{selectedBroadcast.messageText}</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <MessageSquare size={36} className="text-neutral-300 mb-3 opacity-80"/>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-1">No conversation selected</h4>
            <p className="text-[10px] text-neutral-400 font-semibold max-w-xs">
              Select an active Direct Inbox thread or review sent alerts from the left sidebar feed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}