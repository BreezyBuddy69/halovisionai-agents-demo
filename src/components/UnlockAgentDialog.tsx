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
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary">
            <Lock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">Unlock more agents</h2>
            <p className="mt-1 text-xs text-muted-foreground">Enter an access code to unlock additional agents</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-center text-sm tracking-[0.2em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {error && <p className="text-center text-xs text-destructive">Invalid code.</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-secondary">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
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
