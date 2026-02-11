import { useState } from "react";
import AccessGate from "@/components/AccessGate";
import ChatPage from "@/components/ChatPage";

const Index = () => {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <AccessGate onSuccess={() => setAuthenticated(true)} />;
  }

  return <ChatPage />;
};

export default Index;
