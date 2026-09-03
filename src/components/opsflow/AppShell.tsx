import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./primitives";

export const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/email", label: "Smart Email" },
  { to: "/meetings", label: "Meetings" },
  { to: "/planner", label: "Task Planner" },
  { to: "/research", label: "Research" },
  { to: "/assistant", label: "AI Assistant" },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <div className="grid size-8 place-items-center rounded-lg bg-foreground">
        <span className="font-mono text-xs font-medium text-background">OF</span>
      </div>
      <div className="leading-none">
        <p className="text-[15px] font-bold tracking-tight">OpsFlow</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-primary">AI</p>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mt-8 space-y-1 text-sm">
      <p className="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        Workspace
      </p>
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
              active
                ? "bg-foreground font-medium text-background ring-1 ring-foreground/5"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            {active ? <span className="size-1.5 rounded-full bg-accent" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <Brand />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto">
        <Link
          to="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-foreground font-medium text-background"
              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          Settings
        </Link>
        <div className="mt-4 rounded-lg border border-border bg-glass p-3 backdrop-blur-md">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">
            Demo service
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Outputs come from the built-in mock AI layer. No API key required.
          </p>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  breadcrumb,
  children,
}: {
  breadcrumb: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="optic left-[6%] top-[-8%] bg-primary/25" />
        <div className="optic right-[4%] top-[30%] bg-accent/20 opacity-40" />
        <div className="absolute inset-y-0 left-[38%] w-[70%] rotate-[-12deg] border-l border-background/60 bg-gradient-to-br from-background/70 via-background/20 to-transparent backdrop-blur-[2px]" />
        <div className="absolute inset-y-0 left-[70%] w-[45%] rotate-[-12deg] border-l border-primary/10 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-panel/70 px-4 py-6 backdrop-blur-md md:flex">
          <SidebarBody />
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-foreground/30"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-panel px-4 py-6">
              <SidebarBody onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-label="Open navigation"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </Button>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="text-foreground">OpsFlow AI</span>
                <span className="mx-2 text-border">/</span>
                {breadcrumb}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/assistant" className="hidden sm:block">
                <Button variant="outline">Ask Assistant</Button>
              </Link>
              <Link to="/planner">
                <Button variant="ink" size="lg">
                  New action
                </Button>
              </Link>
            </div>
          </header>

          <div className="max-w-[1400px]">{children}</div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <span>OpsFlow AI · One workspace</span>
            <span>Mock service · no API key required</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
