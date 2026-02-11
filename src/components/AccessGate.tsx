import { useState } from "react";
import { Lock } from "lucide-react";

const ACCESS_CODE = "69696969";

interface AccessGateProps {
  onSuccess: () => void;
}

const AccessGate = ({ onSuccess }: AccessGateProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className={`w-full max-w-sm px-6 transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">Enter access code</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the code to access the demo</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="w-full rounded-xl border border-input bg-secondary px-4 py-3 text-center text-lg tracking-[0.3em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {error && (
              <p className="text-center text-sm text-destructive animate-fade-in">
                Invalid code. Try again.
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
