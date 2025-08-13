import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Search as SearchIcon } from "lucide-react";
import {
  ViewToggle,
  FilterSelect,
  CardsView,
  TableView,
  BrowseView,
  DetailsSheet,
  AdminTools,
} from "@/components";
import { DirectoryRecord } from "@/types";
import {
  deriveRegions,
  uniqSorted,
  show,
  sameRecord,
  REGION_KEYS,
} from "@/utils";

export default function App() {
  const [data, setData] = useState<DirectoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("All");
  const [department, setDepartment] = useState("All");
  const [team, setTeam] = useState("All");
  const [region, setRegion] = useState("All");
  const [view, setView] = useState<"cards" | "table" | "browse">("browse");
  const [browseDiv, setBrowseDiv] = useState<string | null>(null);
  const [browseDept, setBrowseDept] = useState<string | null>(null);
  const [browseTeam, setBrowseTeam] = useState<string | null>(null);
  const [selected, setSelected] = useState<DirectoryRecord | null>(null);

  useEffect(() => {
    document.title = "Colonial Life Home Office Directory";
  }, []);

  const isAdmin = useMemo(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      return (
        qp.get("admin") === "1" ||
        (import.meta as any)?.env?.VITE_ENABLE_ADMIN === "true"
      );
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const override = url.searchParams.get("data");
        const src = override || "/data/directory.json";
        const bust = (() => {
          try {
            const u = new URL(src, window.location.origin);
            u.searchParams.set("_ts", String(Date.now()));
            return u.toString();
          } catch {
            return `${src}${src.includes("?") ? "&" : "?"}_ts=${Date.now()}`;
          }
        })();
        const res = await fetch(bust, { cache: "no-store" });
        if (!res.ok) throw new Error("no file");
        const json = await res.json();
        setData(
          (json as DirectoryRecord[]).map((r) => ({
            ...r,
            _Regions: deriveRegions(r),
          }))
        );
      } catch {
        const sample: DirectoryRecord[] = [
          {
            Division: "Marketing",
            Department: "Brand",
            Team: "Campaigns",
            Name: "Michelle White",
            Title: "VP, Marketing",
            Email: "michelle.white@example.com",
            South: "True",
            Midwest: "True",
            Location: "Columbia, SC",
            Timezone: "ET",
          },
        ].map((r) => ({ ...r, _Regions: deriveRegions(r) }));
        setData(sample);
      }
    })();
  }, []);

  const divisions = useMemo(
    () => uniqSorted(data.map((r) => r.Division).filter(show) as string[]),
    [data]
  );
  const departments = useMemo(
    () => uniqSorted(data.map((r) => r.Department).filter(show) as string[]),
    [data]
  );
  const teams = useMemo(
    () => uniqSorted(data.map((r) => r.Team).filter(show) as string[]),
    [data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (division !== "All" && (r.Division || "") !== division) return false;
      if (department !== "All" && (r.Department || "") !== department)
        return false;
      if (team !== "All" && (r.Team || "") !== team) return false;
      if (region !== "All" && !(r._Regions || []).includes(region)) return false;
      if (!q) return true;
      const hay = [
        r.Name,
        r.Title,
        r.Division,
        r.Department,
        r.Team,
        r.Email,
        r["Team Email"],
        r["Support Phone"],
        r.Location,
        r.Description,
        r.Notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, division, department, team, region, query]);

  useEffect(() => {
    if (view !== "browse") return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const matches = filtered.filter(
      (r) => (r.Name || "").trim().toLowerCase() === q
    );
    if (matches.length === 1) {
      const m = matches[0];
      setBrowseDiv(m.Division || null);
      setBrowseDept(m.Department || null);
      setBrowseTeam(m.Team || null);
      setSelected(null);
    }
  }, [query, filtered, view]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="" className="w-8 h-8 rounded-xl" />
              <h1 className="text-xl font-semibold">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/";
                  }}
                  className="hover:underline"
                  style={{ color: "#19557f" }}
                >
                  Colonial Life Home Office Directory
                </a>
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ViewToggle view={view} setView={setView} />
              {isAdmin && <AdminTools data={data} setData={setData} />}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <div className="relative">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search name, team, title, email, notes…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
            </div>
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2">
              <FilterSelect
                label="Division"
                value={division}
                setValue={setDivision}
                options={divisions}
              />
              <FilterSelect
                label="Department"
                value={department}
                setValue={setDepartment}
                options={departments}
              />
              <FilterSelect
                label="Team"
                value={team}
                setValue={setTeam}
                options={teams}
              />
              <FilterSelect
                label="Region"
                value={region}
                setValue={setRegion}
                options={Array.from(REGION_KEYS) as unknown as string[]}
              />
            </div>
          </div>

          {view === "browse" ? (
            <BrowseView
              data={filtered}
              selectedDiv={browseDiv}
              selectedDept={browseDept}
              selectedTeam={browseTeam}
              onDiv={(d) => {
                setBrowseDiv(d);
                setBrowseDept(null);
                setBrowseTeam(null);
              }}
              onDept={(d) => {
                setBrowseDept(d);
                setBrowseTeam(null);
              }}
              onTeam={(t) => setBrowseTeam(t)}
              onBack={() => {
                if (browseTeam) setBrowseTeam(null);
                else if (browseDept) setBrowseDept(null);
                else if (browseDiv) setBrowseDiv(null);
              }}
              onRoot={() => {
                setBrowseDiv(null);
                setBrowseDept(null);
                setBrowseTeam(null);
              }}
              onDivCrumb={() => {
                setBrowseDept(null);
                setBrowseTeam(null);
              }}
              onDeptCrumb={() => {
                setBrowseTeam(null);
              }}
              onOpenCard={(r) => setSelected(r)}
            />
          ) : view === "cards" ? (
            <CardsView
              records={filtered}
              selected={selected}
              onToggle={(r) =>
                setSelected(selected && sameRecord(selected, r) ? null : r)
              }
            />
          ) : (
            <TableView records={filtered} onOpen={(r) => setSelected(r)} />
          )}

          <DetailsSheet
            record={selected}
            onOpenChange={(open) => {
              if (!open) setSelected(null);
            }}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
