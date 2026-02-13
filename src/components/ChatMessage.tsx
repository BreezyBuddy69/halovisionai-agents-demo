import { User, Sparkles } from "lucide-react";

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
    <div className="animate-fade-in py-5">
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex gap-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
              isUser
                ? "bg-chat-user"
                : "bg-secondary shadow-sm"
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4 text-chat-user-foreground" />
            ) : (
              <Sparkles className="h-4 w-4 text-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-1.5 pt-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isUser ? "You" : agentName}
            </p>
            <div className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
