import { User, Bot } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
}

interface ChatMessageProps {
  message: Message;
  agentName: string;
}

const ChatMessage = ({ message, agentName }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className="animate-fade-in py-4">
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex gap-4">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isUser ? "bg-chat-user" : "bg-secondary"
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4 text-chat-user-foreground" />
            ) : (
              <Bot className="h-4 w-4 text-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {isUser ? "You" : agentName}
            </p>
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
