const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-2">
    <div
      className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-dot"
      style={{ animationDelay: "0s" }}
    />
    <div
      className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-dot"
      style={{ animationDelay: "0.2s" }}
    />
    <div
      className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse-dot"
      style={{ animationDelay: "0.4s" }}
    />
  </div>
);

export default TypingIndicator;
