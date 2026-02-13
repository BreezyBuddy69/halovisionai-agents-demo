import { type Agent, agents as allAgents } from "@/lib/agents";
import { Bot, ChevronDown, Lock, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AgentSelectorProps {
  selected: Agent;
  onSelect: (agent: Agent) => void;
  agents: Agent[];
  onUnlockRequest: () => void;
}

const AgentSelector = ({ selected, onSelect, agents, onUnlockRequest }: AgentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unlockedIds = new Set(agents.map((a) => a.id));
  const lockedAgents = allAgents.filter((a) => !unlockedIds.has(a.id));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <Bot className="h-4 w-4 text-foreground" />
        <span>{selected.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-fade-in">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => { onSelect(agent); setOpen(false); }}
              className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                selected.id === agent.id ? "bg-accent" : ""
              }`}
            >
              <span className="text-sm font-medium text-foreground">{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.description}</span>
            </button>
          ))}

          {lockedAgents.length > 0 && (
            <>
              <div className="my-1 border-t border-border" />
              {lockedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 opacity-40"
                >
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{agent.name}</span>
                </div>
              ))}
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => { onUnlockRequest(); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Unlock more agents</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
