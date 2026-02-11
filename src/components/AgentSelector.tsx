import { agents, type Agent } from "@/lib/agents";
import { Bot, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AgentSelectorProps {
  selected: Agent;
  onSelect: (agent: Agent) => void;
}

const AgentSelector = ({ selected, onSelect }: AgentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span>{selected.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-fade-in">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => { onSelect(agent); setOpen(false); }}
              className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                selected.id === agent.id ? "bg-accent" : ""
              }`}
            >
              <span className="text-sm font-medium text-foreground">{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.description} · {agent.domain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
