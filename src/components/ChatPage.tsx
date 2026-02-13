import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Sun, Moon, Sparkles, Plus, MessageSquare, FlaskConical, Trash2 } from "lucide-react";
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
  const availableAgents = useMemo(
    () => (allowedAgents === "all" ? agents : agents.filter((a) => allowedAgents.includes(a.id))),
    [allowedAgents]
  );

  const [selectedAgent, setSelectedAgent] = useState<Agent>(availableAgents[0]);
  // Chat sessions per agent: agentId -> ChatSession[]
  const [agentSessions, setAgentSessions] = useState<Record<string, ChatSession[]>>({});
  // Active session id per agent
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
  const thinkingInterval = useRef<ReturnType<typeof setInterval>>();

  // Get or create sessions for current agent
  const currentSessions = agentSessions[selectedAgent.id] || [];
  const activeSessionId = activeSessionIds[selectedAgent.id];
  const activeSession = currentSessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

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

  // Process queued message when loading finishes
  useEffect(() => {
    if (!loading && queuedMessage) {
      const msg = queuedMessage;
      setQueuedMessage(null);
      // Small delay to let state settle
      setTimeout(() => handleSend(msg), 100);
    }
  }, [loading, queuedMessage]);

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
    setSidebarOpen(false);
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
    setSidebarOpen(false);
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
    // If loading, queue the message
    if (loading) {
      setQueuedMessage(text);
      return;
    }

    const sessionId = ensureSession();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };

    // Get current messages for the session
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
        // In test mode, don't expect a response — just confirm sent
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 rounded-r-2xl border-r border-border bg-card transition-transform duration-200 lg:relative lg:rounded-none lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-[13px]">
            <span className="text-sm font-semibold text-foreground">Chats</span>
            <button
              onClick={handleNewChat}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {currentSessions.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">No chats yet</p>
            )}
            {[...currentSessions].reverse().map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-accent ${
                  activeSessionId === session.id ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setActiveSessionIds((prev) => ({ ...prev, [selectedAgent.id]: session.id }));
                  setSidebarOpen(false);
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                  className="hidden h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-[13px]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary lg:hidden"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary lg:flex"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <AgentSelector
              selected={selectedAgent}
              onSelect={handleAgentChange}
              agents={availableAgents}
              onUnlockRequest={() => setUnlockDialogOpen(true)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestMode(!testMode)}
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
                testMode
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              {testMode ? "TEST" : "Live"}
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-secondary"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-4 animate-fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary">
                <Sparkles className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{selectedAgent.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedAgent.description} · {selectedAgent.domain}
              </p>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                Send a message to start a conversation.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} agentName={selectedAgent.name} />
          ))}

          {loading && (
            <div className="animate-fade-in py-4">
              <div className="mx-auto max-w-2xl px-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                    <Sparkles className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{thinkingText}</p>
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={false}
          placeholder={`Message ${selectedAgent.name}...`}
          queuedMessage={queuedMessage}
        />
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
