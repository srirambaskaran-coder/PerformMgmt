import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewModeToggleProps {
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "card" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("card")}
        data-testid="view-mode-card"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Card
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("table")}
        data-testid="view-mode-table"
      >
        <LayoutList className="h-4 w-4 mr-1" />
        Table
      </Button>
    </div>
  );
}
