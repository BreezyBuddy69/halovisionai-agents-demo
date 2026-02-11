const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-1 py-2">
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0s" }} />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
  </div>
);

export default TypingIndicator;
