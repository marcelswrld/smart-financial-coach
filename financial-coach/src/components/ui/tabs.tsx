import * as React from "react";

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

export function Tabs({ children, className, defaultValue }: { children: React.ReactNode; className?: string; defaultValue?: string }) {
  const [value, setValue] = React.useState<string>(defaultValue || "");
  const ctx = React.useMemo(() => ({ value, setValue }), [value]);
  return (
    <TabsContext.Provider value={ctx}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-2 border-b pb-2 ${className}`}>{children}</div>;
}

export function TabsTrigger({
  children,
  className,
  value,
}: { children: React.ReactNode; className?: string; value: string }) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;
  return (
    <button
      onClick={() => ctx?.setValue(value)}
      className={`px-4 py-2 rounded-t-md border-b-2 ${isActive ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600"} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, value }: { children: React.ReactNode; className?: string; value: string }) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
