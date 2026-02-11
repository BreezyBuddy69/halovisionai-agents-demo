import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { agents, type Agent } from "@/lib/agents";
import { supabase } from "@/integrations/supabase/client";
import AgentSelector from "@/components/AgentSelector";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";

const ChatPage = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>({});
  const messages = chatHistories[selectedAgent.id] || [];
  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setChatHistories((prev) => {
      const current = prev[selectedAgent.id] || [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [selectedAgent.id]: next };
    });
  };
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("Thinking");
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Animate thinking text
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

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
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
      // Fallback: stringify nicely
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("webhook-proxy", {
        body: { message: text, webhookUrl: selectedAgent.webhook },
      });

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
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error("Request failed:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "Something went wrong connecting to the agent. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <AgentSelector selected={selectedAgent} onSelect={handleAgentChange} />
        <button
          onClick={() => setDark(!dark)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{selectedAgent.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedAgent.description} · {selectedAgent.domain}
            </p>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              Send a message to start a conversation with this agent.
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
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

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        placeholder={`Message ${selectedAgent.name}...`}
      />
    </div>
  );
};

export default ChatPage;
