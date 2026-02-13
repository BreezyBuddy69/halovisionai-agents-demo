import { useState, useEffect } from "react";
import { Lock, ArrowRight } from "lucide-react";

interface AccessCode {
  code: string;
  allowedAgents: string[] | "all";
}

export const ACCESS_CODES: AccessCode[] = [
  { code: "jay112233", allowedAgents: "all" },
  { code: "halo112233", allowedAgents: ["halovision"] },
  { code: "chiro112233", allowedAgents: ["chiroli"] },
  { code: "german112233", allowedAgents: ["simplygerman"] },
  { code: "safe3d112233", allowedAgents: ["safe3d"] },
];

interface AccessGateProps {
  onSuccess: (allowedAgents: string[] | "all") => void;
}

const AccessGate = ({ onSuccess }: AccessGateProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {};
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = ACCESS_CODES.find((ac) => ac.code === code);
    if (match) {
      onSuccess(match.allowedAgents);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background">
      <div
        className={`w-full max-w-sm px-6 transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        <div className="flex flex-col items-center gap-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary shadow-lg">
            <Lock className="h-7 w-7 text-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Enter your access code to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="w-full rounded-2xl border border-border bg-secondary px-5 py-3.5 text-center text-base tracking-[0.25em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
              autoFocus
            />
            {error && (
              <p className="text-center text-sm text-destructive animate-fade-in">
                Invalid code. Try again.
              </p>
            )}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
