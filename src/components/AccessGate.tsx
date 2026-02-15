import { useState, useEffect } from "react";
import { Lock, ArrowRight, Loader2, Shield, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

type AuthMethod = "local" | "webhook";

interface AccessGateProps {
  onSuccess: (allowedAgents: string[] | "all") => void;
}

const AccessGate = ({ onSuccess }: AccessGateProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("local");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {};
  }, []);

  const handleLocalAuth = () => {
    const match = ACCESS_CODES.find((ac) => ac.code === code);
    if (match) {
      onSuccess(match.allowedAgents);
    } else {
      triggerError();
    }
  };

  const handleWebhookAuth = async () => {
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("code-checker", {
        body: { code },
      });

      if (fnError) {
        console.error("Code checker error:", fnError);
        triggerError();
        return;
      }

      if (data?.valid) {
        onSuccess(data.allowedAgents || "all");
      } else {
        triggerError();
      }
    } catch (err) {
      console.error("Webhook auth failed:", err);
      triggerError();
    } finally {
      setLoading(false);
    }
  };

  const triggerError = () => {
    setError(true);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setError(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (authMethod === "local") {
      handleLocalAuth();
    } else {
      handleWebhookAuth();
    }
  };

  return (
    <div className="dark flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div
        className={`w-full max-w-sm transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
        style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary shadow-lg">
              <Lock className="h-7 w-7 text-foreground" />
            </div>
            <h1
              className="text-2xl font-bold tracking-[0.3em] text-white uppercase"
              style={{ fontFamily: "'Anurati', sans-serif" }}
            >
              HALOVISIONAI
            </h1>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-semibold tracking-tight text-foreground">Welcome back</p>
            <p className="text-sm text-muted-foreground">Enter your access code to continue</p>
          </div>

          {/* Auth method toggle */}
          <div className="flex w-full rounded-2xl bg-secondary p-1 gap-1">
            <button
              type="button"
              onClick={() => setAuthMethod("local")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-all ${
                authMethod === "local"
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Local</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("webhook")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium transition-all ${
                authMethod === "webhook"
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wifi className="h-3.5 w-3.5" />
              <span>Cloud</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="w-full rounded-2xl border border-border bg-secondary px-5 py-3.5 text-center text-base tracking-[0.25em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="text-center text-sm text-destructive animate-fade-in">
                Invalid code. Try again.
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3.5 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
