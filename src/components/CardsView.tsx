import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { DirectoryRecord } from "@/types";
import { RegionPill } from "./RegionPill";
import { show, sameRecord } from "@/utils";

export function CardsView({
  records,
  selected,
  onToggle,
}: {
  records: DirectoryRecord[];
  selected: DirectoryRecord | null;
  onToggle: (r: DirectoryRecord) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {records.map((r, idx) => (
        <Card
          key={idx}
           className="rounded-2xl shadow-sm hover:shadow transition cursor-pointer h-full flex flex-col"
          onClick={() => onToggle(r)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">
                <div className="font-medium leading-snug break-words">{r.Name || "(No name)"}</div>
                {show(r.Title) && (
                  <div className="text-xs text-slate-500 font-normal mt-0.5 leading-snug break-words">
                    {r.Title}
                  </div>
                )}
              </CardTitle>
              {(r._Regions || []).length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {(r._Regions || []).map((reg) => (
                    <RegionPill key={reg} name={reg} />
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-2 flex-1">
              <div className="text-sm text-slate-700">
                {[r.Division, r.Department, r.Team].some(show) && (
                  <div className="break-words">
                    {[r.Division, r.Department, r.Team].filter(show).join(" · ")}
                  </div>
                )}
                {show(r.Location) && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-4 h-4" /> {r.Location}
                  </div>
                )}
              </div>
              
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(r);
              }}
              className="w-full mt-2"
            >
              {selected && sameRecord(selected, r)
                ? "Close full contact info"
                : "Show full contact info"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
