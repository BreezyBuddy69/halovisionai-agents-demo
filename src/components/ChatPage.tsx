import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Sun, Moon, Sparkles, Plus, PanelLeftClose, PanelLeft, FlaskConical, Trash2, MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { agents, type Agent } from "@/lib/agents";
import { supabase } from "@/integrations/supabase/client";
import AgentSelector from "@/components/AgentSelector";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import UnlockAgentDialog from "@/components/UnlockAgentDialog";

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ChatPageProps {
  allowedAgents: string[] | "all";
  onUnlockMore: (agents: string[] | "all") => void;
}

const ChatPage = ({ allowedAgents, onUnlockMore }: ChatPageProps) => {
  const isMobile = useIsMobile();
  const availableAgents = useMemo(
    () => (allowedAgents === "all" ? agents : agents.filter((a) => allowedAgents.includes(a.id))),
    [allowedAgents]
  );

  const [selectedAgent, setSelectedAgent] = useState<Agent>(availableAgents[0]);
  const [agentSessions, setAgentSessions] = useState<Record<string, ChatSession[]>>({});
  const [activeSessionIds, setActiveSessionIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("Thinking");
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const thinkingInterval = useRef<ReturnType<typeof setInterval>>();

  const currentSessions = agentSessions[selectedAgent.id] || [];
  const activeSessionId = activeSessionIds[selectedAgent.id];
  const activeSession = currentSessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  const hasMessages = messages.length > 0 || loading;

  const ensureSession = useCallback(() => {
    if (!activeSessionIds[selectedAgent.id]) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
      };
      setAgentSessions((prev) => ({
        ...prev,
        [selectedAgent.id]: [...(prev[selectedAgent.id] || []), newSession],
      }));
      setActiveSessionIds((prev) => ({ ...prev, [selectedAgent.id]: newSession.id }));
      return newSession.id;
    }
    return activeSessionIds[selectedAgent.id];
  }, [selectedAgent.id, activeSessionIds]);

  const updateSessionMessages = useCallback(
    (sessionId: string, updater: (prev: Message[]) => Message[]) => {
      setAgentSessions((prev) => {
        const sessions = prev[selectedAgent.id] || [];
        return {
          ...prev,
          [selectedAgent.id]: sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const newMsgs = updater(s.messages);
            const title = s.messages.length === 0 && newMsgs.length > 0
              ? newMsgs[0].content.slice(0, 30) + (newMsgs[0].content.length > 30 ? "…" : "")
              : s.title;
            return { ...s, messages: newMsgs, title };
          }),
        };
      });
    },
    [selectedAgent.id]
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (loading) {
      let dots = 0;
      thinkingInterval.current = setInterval(() => {
        dots = (dots + 1) % 4;
        setThinkingText("Thinking" + ".".repeat(dots));
      }, 500);
    } else {
      if (thinkingInterval.current) clearInterval(thinkingInterval.current);
      setThinkingText("Thinking");
    }
    return () => {
      if (thinkingInterval.current) clearInterval(thinkingInterval.current);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading && queuedMessage) {
      const msg = queuedMessage;
      setQueuedMessage(null);
      setTimeout(() => handleSend(msg), 100);
    }
  }, [loading, queuedMessage]);

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    };
    setAgentSessions((prev) => ({
      ...prev,
      [selectedAgent.id]: [...(prev[selectedAgent.id] || []), newSession],
    }));
    setActiveSessionIds((prev) => ({ ...prev, [selectedAgent.id]: newSession.id }));
  };

  const handleDeleteSession = (sessionId: string) => {
    setAgentSessions((prev) => ({
      ...prev,
      [selectedAgent.id]: (prev[selectedAgent.id] || []).filter((s) => s.id !== sessionId),
    }));
    if (activeSessionIds[selectedAgent.id] === sessionId) {
      setActiveSessionIds((prev) => {
        const remaining = (agentSessions[selectedAgent.id] || []).filter((s) => s.id !== sessionId);
        return { ...prev, [selectedAgent.id]: remaining.length > 0 ? remaining[remaining.length - 1].id : "" };
      });
    }
  };

  const extractReply = (data: unknown): string => {
    if (typeof data === "string") return data;
    if (Array.isArray(data) && data.length > 0) return extractReply(data[0]);
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      for (const key of ["output", "response", "message", "text", "answer", "result", "reply"]) {
        if (obj[key] !== undefined) {
          return typeof obj[key] === "string" ? (obj[key] as string) : JSON.stringify(obj[key]);
        }
      }
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  const handleSend = async (text: string) => {
    if (loading) {
      setQueuedMessage(text);
      return;
    }

    const sessionId = ensureSession();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };

    const currentSession = (agentSessions[selectedAgent.id] || []).find((s) => s.id === sessionId);
    const currentMessages = currentSession?.messages || [];
    const updatedMessages = [...currentMessages, userMsg];

    updateSessionMessages(sessionId, () => updatedMessages);
    setLoading(true);

    const recentMessages = updatedMessages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const webhookUrl = testMode ? selectedAgent.testWebhook : selectedAgent.webhook;

    try {
      const { data, error } = await supabase.functions.invoke("webhook-proxy", {
        body: { messages: recentMessages, webhookUrl, testMode },
      });

      if (testMode) {
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: "✅ Test message sent to webhook.",
        };
        updateSessionMessages(sessionId, (prev) => [...prev, agentMsg]);
      } else {
        let reply = "Sorry, I couldn't get a response. Please try again.";

        if (error) {
          console.error("Edge function error:", error);
        } else if (data?.data !== undefined) {
          reply = extractReply(data.data);
        } else if (data?.error) {
          reply = `Error: ${data.error}`;
        }

        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: reply,
        };
        updateSessionMessages(sessionId, (prev) => [...prev, agentMsg]);
      }
    } catch (err) {
      console.error("Request failed:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "Something went wrong connecting to the agent. Please try again.",
      };
      updateSessionMessages(sessionId, (prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background relative">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 bg-card transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `shrink-0 border-r border-border bg-card transition-all duration-300 ease-in-out overflow-hidden ${
                sidebarOpen ? "w-72" : "w-0 border-r-0"
              }`
        }`}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <span className="text-sm font-semibold text-foreground tracking-tight">Chats</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="New chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-2">
            {currentSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs text-muted-foreground">No chats yet</p>
              </div>
            )}
            {[...currentSessions].reverse().map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm cursor-pointer transition-all mb-0.5 ${
                  activeSessionId === session.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
                onClick={() => {
                  setActiveSessionIds((prev) => ({ ...prev, [selectedAgent.id]: session.id }));
                  if (isMobile) setSidebarOpen(false);
                }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-[13px]">{session.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                  className="hidden h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 group-hover:flex transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header - sticky */}
        <header className="flex items-center justify-between border-b border-border px-3 sm:px-4 py-3 shrink-0 bg-background z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <AgentSelector
              selected={selectedAgent}
              onSelect={handleAgentChange}
              agents={availableAgents}
              onUnlockRequest={() => setUnlockDialogOpen(true)}
            />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setTestMode(!testMode)}
              className={`flex h-9 items-center gap-1.5 rounded-2xl border px-2.5 sm:px-3.5 text-xs font-medium transition-all ${
                testMode
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{testMode ? "TEST" : "Live"}</span>
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Content area - ChatGPT style: centered when empty, scrollable when messages */}
        {!hasMessages ? (
          /* Empty state: centered with input */
          <div className="flex flex-1 flex-col items-center justify-center px-4 overflow-hidden">
            <div className="flex flex-col items-center gap-4 mb-8 animate-fade-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-secondary shadow-sm">
                <Sparkles className="h-6 w-6 text-foreground" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{selectedAgent.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedAgent.description} · {selectedAgent.domain}
                </p>
              </div>
            </div>
            <div className="w-full max-w-2xl">
              <ChatInput
                onSend={handleSend}
                disabled={false}
                placeholder={`Message ${selectedAgent.name}...`}
                queuedMessage={queuedMessage}
              />
            </div>
          </div>
        ) : (
          /* Messages state: scrollable messages + fixed input at bottom */
          <>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} agentName={selectedAgent.name} />
              ))}

              {loading && (
                <div className="animate-fade-in py-5">
                  <div className="mx-auto max-w-2xl px-4">
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary shadow-sm">
                        <Sparkles className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{thinkingText}</p>
                        <TypingIndicator />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="shrink-0">
              <ChatInput
                onSend={handleSend}
                disabled={false}
                placeholder={`Message ${selectedAgent.name}...`}
                queuedMessage={queuedMessage}
              />
            </div>
          </>
        )}
      </div>

      <UnlockAgentDialog
        open={unlockDialogOpen}
        onClose={() => setUnlockDialogOpen(false)}
        onUnlock={onUnlockMore}
      />
    </div>
  );
};

export default ChatPage;
