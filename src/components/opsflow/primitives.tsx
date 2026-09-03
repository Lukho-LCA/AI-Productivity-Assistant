import { cva, type VariantProps } from "class-variance-authority";
import { useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { RESPONSIBLE_AI_NOTICE } from "@/lib/opsflow/types";

/* --------------------------------- buttons -------------------------------- */

export const opsButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground ring-1 ring-foreground/5 hover:bg-primary/90",
        ink: "bg-foreground text-background ring-1 ring-foreground/5 hover:bg-foreground/90",
        outline:
          "border border-border bg-glass text-muted-foreground hover:text-foreground hover:bg-glass-strong",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3.5 py-2 text-sm",
        lg: "px-4 py-2.5 text-sm font-semibold",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export interface OpsButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof opsButton> {}

export function Button({ className, variant, size, ...props }: OpsButtonProps) {
  return <button className={cn(opsButton({ variant, size }), className)} {...props} />;
}

/* --------------------------------- panels --------------------------------- */

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-panel/80 p-5 ring-1 ring-foreground/5 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  kicker,
  actions,
}: {
  title: string;
  kicker?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex items-center gap-2">
        {kicker ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {kicker}
          </span>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className="eyebrow">{children}</p>
      {action}
    </div>
  );
}

/* ---------------------------------- forms --------------------------------- */

const fieldClasses =
  "w-full rounded-lg border border-border bg-glass-strong px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-mono mb-1.5">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClasses, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClasses, "resize-y", props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClasses, props.className)} />;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- states --------------------------------- */

export function AiBadge({ label = "AI-generated" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
      <span className="size-1.5 rounded-full bg-accent" />
      {label}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-glass p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-[46ch] text-[13px] text-muted-foreground">{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Working…" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{label}</p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-foreground/10"
          style={{ width: `${100 - i * 18}%` }}
        />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-[13px] text-destructive"
    >
      {message}
    </div>
  );
}

export function ResponsibleAiNotice({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border bg-foreground/[0.03] p-4 backdrop-blur-md",
        className,
      )}
    >
      <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10">
        <span className="size-1.5 rounded-full bg-accent" />
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
          Responsible AI
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-pretty text-muted-foreground">
          {RESPONSIBLE_AI_NOTICE}
        </p>
      </div>
    </section>
  );
}

/* --------------------------------- copying -------------------------------- */

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
}: {
  value: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
      aria-live="polite"
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function OutputList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-primary/60" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
