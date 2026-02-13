import { useState } from "react";
import { Lock } from "lucide-react";
import { ACCESS_CODES } from "@/components/AccessGate";

interface UnlockAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onUnlock: (allowedAgents: string[] | "all") => void;
}

const UnlockAgentDialog = ({ open, onClose, onUnlock }: UnlockAgentDialogProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = ACCESS_CODES.find((ac) => ac.code === code);
    if (match) {
      onUnlock(match.allowedAgents);
      setCode("");
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Lock className="h-5 w-5 text-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Unlock more agents</h2>
            <p className="text-xs text-muted-foreground">Enter an access code to unlock additional agents</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-center text-sm tracking-[0.2em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
              autoFocus
            />
            {error && <p className="text-center text-xs text-destructive animate-fade-in">Invalid code.</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm text-foreground transition-all hover:bg-accent">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded-2xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]">
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UnlockAgentDialog;
