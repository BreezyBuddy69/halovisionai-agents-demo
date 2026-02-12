import { useState } from "react";
import AccessGate from "@/components/AccessGate";
import ChatPage from "@/components/ChatPage";

const Index = () => {
  const [allowedAgents, setAllowedAgents] = useState<string[] | "all" | null>(null);

  if (!allowedAgents) {
    return <AccessGate onSuccess={(agents) => setAllowedAgents(agents)} />;
  }

  return <ChatPage allowedAgents={allowedAgents} />;
};

export default Index;
