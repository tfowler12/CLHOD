import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Rows3 } from "lucide-react";

export function ViewToggle({
  view,
  setView,
}: {
  view: "cards" | "table" | "browse";
  setView: (v: "cards" | "table" | "browse") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border p-1 shadow-sm">
      <Button
        variant={view === "browse" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("browse")}
      >
        <LayoutGrid className="w-4 h-4 mr-1" /> Browse Organization
      </Button>
      <Button
        variant={view === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("cards")}
      >
        <LayoutGrid className="w-4 h-4 mr-1" /> Cards
      </Button>
      <Button
        variant={view === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("table")}
      >
        <Rows3 className="w-4 h-4 mr-1" /> Table
      </Button>
    </div>
  );
}
