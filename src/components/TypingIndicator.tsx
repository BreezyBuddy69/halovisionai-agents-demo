const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-3">
    <div
      className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse-dot"
      style={{ animationDelay: "0s" }}
    />
    <div
      className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse-dot"
      style={{ animationDelay: "0.2s" }}
    />
    <div
      className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse-dot"
      style={{ animationDelay: "0.4s" }}
    />
  </div>
);

export default TypingIndicator;
