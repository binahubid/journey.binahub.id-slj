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
}>({ activeTab: "", setActiveTab: () => {} });

function Tabs({ defaultValue = "", value, onValueChange, children, className }: TabsProps) {
  const [internalTab, setInternalTab] = React.useState(defaultValue);

  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (v: string) => {
    setInternalTab(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ─── Tabs List ────────────────────────────────────────────────────────────────
function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-md bg-warm-bg border border-warm-border p-1 gap-1",
        className
      )}
      role="tablist"
      {...props}
    />
  );
}

// ─── Tabs Trigger ─────────────────────────────────────────────────────────────
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5",
        "text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900",
        isActive
          ? "bg-white text-navy-900 shadow-sm border border-warm-border"
          : "text-gray-500 hover:text-navy-900",
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
  const { activeTab } = React.useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
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
