import { useState } from "react";
import AccessGate from "@/components/AccessGate";
import ChatPage from "@/components/ChatPage";

const Index = () => {
  const [allowedAgents, setAllowedAgents] = useState<string[] | "all" | null>(null);

  const handleUnlockMore = (newAgents: string[] | "all") => {
    if (newAgents === "all") {
      setAllowedAgents("all");
      return;
    }
    setAllowedAgents((prev) => {
      if (prev === "all") return "all";
      if (!prev) return newAgents;
      const merged = Array.from(new Set([...prev, ...newAgents]));
      return merged;
    });
  };

  if (!allowedAgents) {
    return <AccessGate onSuccess={(agents) => setAllowedAgents(agents)} />;
  }

  return <ChatPage allowedAgents={allowedAgents} onUnlockMore={handleUnlockMore} />;
};

export default Index;
