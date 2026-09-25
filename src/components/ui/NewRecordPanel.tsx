"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "./Button";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { PanelContext } from "./PanelContext";

export function NewRecordPanel({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> {label}
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </CardHeader>
      <CardContent>
        <PanelContext.Provider value={{ close: () => setOpen(false) }}>{children}</PanelContext.Provider>
      </CardContent>
    </Card>
  );
}
