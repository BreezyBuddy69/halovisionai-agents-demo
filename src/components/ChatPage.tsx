import { useState, useRef, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { agents, type Agent } from "@/lib/agents";
import AgentSelector from "@/components/AgentSelector";
import ChatMessage, { type Message } from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";

interface ChatPageProps {}

const ChatPage = (_props: ChatPageProps) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([]);
  };

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(selectedAgent.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      let reply = "Sorry, I couldn't get a response. Please try again.";

      if (res.ok) {
        const data = await res.json();
        // Try to extract text from common response formats
        if (typeof data === "string") {
          reply = data;
        } else if (data.output) {
          reply = data.output;
        } else if (data.response) {
          reply = data.response;
        } else if (data.message) {
          reply = data.message;
        } else if (data.text) {
          reply = data.text;
        } else if (data.answer) {
          reply = data.answer;
        } else if (data.result) {
          reply = typeof data.result === "string" ? data.result : JSON.stringify(data.result);
        } else {
          // Fallback: stringify but present nicely
          reply = JSON.stringify(data, null, 2);
        }
      }

      const agentMsg: Message = { id: (Date.now() + 1).toString(), role: "agent", content: reply };
      setMessages((prev) => [...prev, agentMsg]);
    } catch {
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
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <span className="text-lg">🤖</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{selectedAgent.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedAgent.description} · {selectedAgent.domain}</p>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              Send a message to start a conversation with this agent.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} agentName={selectedAgent.name} />
        ))}

        {loading && (
          <div className="py-4">
            <div className="mx-auto max-w-2xl px-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <span className="text-sm">🤖</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{selectedAgent.name}</p>
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
