import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Tabs Root ────────────────────────────────────────────────────────────────
// Sesuai COMPONENT_INVENTORY.md: dipakai di halaman Profile/Settings
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
  id: string;
}>({ activeTab: "", setActiveTab: () => {}, id: "" });

function Tabs({ defaultValue = "", value, onValueChange, children, className }: TabsProps) {
  const [internalTab, setInternalTab] = React.useState(defaultValue);
  const id = React.useId();

  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (v: string) => {
    setInternalTab(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, id }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── Tabs List ────────────────────────────────────────────────────────────────
function TabsList({ className, onKeyDown, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex min-h-12 items-center rounded-md bg-warm-bg border border-warm-border p-1 gap-1",
        className
      )}
      role="tablist"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const vertical = props["aria-orientation"] === "vertical";
        const next = vertical ? "ArrowDown" : "ArrowRight";
        const previous = vertical ? "ArrowUp" : "ArrowLeft";
        if (![next, previous, "Home", "End"].includes(event.key)) return;
        const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
        const index = tabs.indexOf(event.target as HTMLButtonElement);
        if (index < 0 || !tabs.length) return;
        event.preventDefault();
        const target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
          : (index + (event.key === next ? 1 : -1) + tabs.length) % tabs.length;
        tabs[target].focus();
        tabs[target].click();
      }}
      {...props}
    />
  );
}

// ─── Tabs Trigger ─────────────────────────────────────────────────────────────
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { activeTab, setActiveTab, id } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      id={`${id}-tab-${value}`}
      aria-controls={`${id}-panel-${value}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
        "text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900",
        isActive
          ? "bg-white text-navy-900 shadow-sm border border-warm-border"
          : "text-gray-600 hover:text-navy-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Tabs Content ─────────────────────────────────────────────────────────────
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { activeTab, id } = React.useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${id}-panel-${value}`}
      aria-labelledby={`${id}-tab-${value}`}
      tabIndex={0}
      className={cn(
        "mt-4 focus-visible:outline-none",
        "animate-in fade-in-0 duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
