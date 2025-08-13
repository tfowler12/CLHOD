
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Search as SearchIcon, Download, ExternalLink, MapPin, Clock, Settings, LayoutGrid, Rows3, X } from "lucide-react";
import Papa from "papaparse";

// ----------------------------- Types -----------------------------
export type DirectoryRecord = {
  "Person ID"?: string;
  "Manager ID"?: string;
  "Manager Email"?: string;
  "Is Team Lead"?: string | boolean;
  "Sort Order"?: number | string;
  "Employee Type"?: string;

  Division?: string;
  Department?: string;
  Team?: string;

  Name?: string;
  Title?: string;
  "Mobile #"?: string;
  "Office #"?: string;
  Email?: string;

  "Team Email"?: string;
  "Support Phone"?: string;

  South?: string; Southeast?: string; Midwest?: string; Northeast?: string; Pacific?: string;

  "Location Support"?: string;
  "ChangeGear Self-Service Portal"?: string; "ChangeGear Self-Service Portal Description"?: string;
  "Enrollment Technology Hub"?: string; "Enrollment Technology Hub Description"?: string;
  "Propr Resource"?: string; "Plan Administrator Support"?: string; "Field Office Representatives Support"?: string;
  "Claim Forms/Doc Support"?: string; "VB Claims"?: string; "Dental Claims"?: string; "Vision Claims"?: string;
  "Disability + A&H Claims"?: string; "Special Risk Claims (Cancer/CI/Life)"?: string; Life?: string;
  "Supplemental Health (Accident, Critical Illness, Cancer, Hospital Indemnity)"?: string;
  "Disability Plus / Paid Leave"?: string; Dental?: string;
  Resource?: string; Description?: string; Days?: string; Hours?: string; Location?: string; Timezone?: string; Notes?: string;
  "Alliance Partners Managed"?: string; "Oversight Partners"?: string;

  _Regions?: string[];
};

// ----------------------------- Constants -----------------------------
export const REGION_KEYS = ["South", "Southeast", "Midwest", "Northeast", "Pacific"] as const;
export const REGION_COLORS: Record<string, string> = {
  South: "#092C48",
  Southeast: "#B72B33",
  Northeast: "#74922C",
  Midwest: "#007C85",
  Pacific: "#D46201",
};

// ----------------------------- Helpers -----------------------------
export const truthyFlag = (v?: string) => {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["y","yes","true","1","✓","x"].includes(s);
};
export const deriveRegions = (r: DirectoryRecord) => REGION_KEYS.filter(k => truthyFlag(r[k])).map(k=>k);
const normalize = (s?: string) => (s || '').trim();
const personId = (r: DirectoryRecord) => normalize(r['Person ID']) || normalize(r.Email);
const managerId = (r: DirectoryRecord) => normalize(r['Manager ID']) || normalize(r['Manager Email']);
const sortOrderNum = (r: DirectoryRecord) => {
  const v = (typeof r['Sort Order'] === 'string' ? Number(r['Sort Order']) : (r['Sort Order'] as number)) || 0;
  return Number.isFinite(v) ? v : 0;
};
const mailto = (v?: string) => (v ? `mailto:${v}` : undefined);
const telLink = (v?: string) => (v ? `tel:${(v||'').replace(/[^+\d]/g,'')}` : undefined);

function isNonValue(v?: string) {
  if (!v) return true;
  const s = String(v).trim();
  if (s === "") return true;
  return /^(false|no|n|0|na|n\/a|n\.?a\.?|none|tbd|to be determined|\-|--)$/i.test(s);
}
function show(v?: string) { return !isNonValue(v); }

function sameRecord(a?: DirectoryRecord | null, b?: DirectoryRecord | null) {
  if (!a || !b) return false;
  const aKey = `${a.Name || ''}|${a.Email || ''}|${a.Title || ''}`;
  const bKey = `${b.Name || ''}|${b.Email || ''}|${b.Title || ''}`;
  return aKey === bKey;
}

function triggerDownload(url: string, filename: string){ const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
function uniqSorted(arr: string[]){ return Array.from(new Set(arr)).sort((a,b)=> a.localeCompare(b)); }
function trimAll<T extends Record<string, any>>(obj: T): T {
  const out = { ...obj };
  Object.keys(out).forEach((k) => { const v = out[k as keyof T]; if (typeof v === "string") out[k as keyof T] = v.trim() as any; });
  return out;
}

export function RegionPill({ name }:{ name:string }){
  const color = REGION_COLORS[name] || '#5B7183';
  const style: React.CSSProperties = { color, borderColor: color, borderWidth: 1 };
  return <span aria-label={`Region ${name}`} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white border" style={style}>{name}</span>;
}

// Accessible hierarchy color styles
function hierarchyClasses(depth: number): string {
  if (depth === 0) return "bg-sky-800 text-white border-sky-900";
  if (depth === 1) return "bg-emerald-700 text-white border-emerald-800";
  if (depth === 2) return "bg-indigo-700 text-white border-indigo-800";
  return "bg-slate-50 text-slate-900 border-slate-300";
}

// Responsive helpers
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsDesktop(('matches' in e ? e.matches : (e as MediaQueryList).matches));
    setIsDesktop(mq.matches);
    if ((mq as any).addEventListener) mq.addEventListener('change', handler as any);
    else (mq as any).addListener(handler as any);
    return () => {
      if ((mq as any).removeEventListener) mq.removeEventListener('change', handler as any);
      else (mq as any).removeListener(handler as any);
    };
  }, []);
  return isDesktop;
}

// ----------------------------- App -----------------------------
export default function App(){
  const [data, setData] = useState<DirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("All");
  const [department, setDepartment] = useState("All");
  const [team, setTeam] = useState("All");
  const [region, setRegion] = useState("All");
  const [view, setView] = useState<'cards'|'table'|'browse'>('browse');
  const [browseDiv, setBrowseDiv] = useState<string | null>(null);
  const [browseDept, setBrowseDept] = useState<string | null>(null);
  const [browseTeam, setBrowseTeam] = useState<string | null>(null);
  const [selected, setSelected] = useState<DirectoryRecord|null>(null);

  useEffect(()=>{ document.title = "Colonial Life Home Office Directory"; },[]);

  const isAdmin = useMemo(()=>{
    try { const qp = new URLSearchParams(window.location.search); return qp.get('admin') === '1' || (import.meta as any)?.env?.VITE_ENABLE_ADMIN === 'true'; } catch { return false; }
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const url = new URL(window.location.href); const override = url.searchParams.get('data');
        const src = override || '/data/directory.json';
        const bust = (()=>{ try { const u = new URL(src, window.location.origin); u.searchParams.set('_ts', String(Date.now())); return u.toString(); } catch { return src + (src.includes('?')?'&':'?') + `_ts=${Date.now()}`; } })();
        const res = await fetch(bust, { cache: 'no-store' });
        if (!res.ok) throw new Error('no file');
        const json = await res.json();
        setData((json as DirectoryRecord[]).map(r => ({...r, _Regions: deriveRegions(r)})));
      }catch{
        const sample: DirectoryRecord[] = [{ Division: "Marketing", Department: "Brand", Team: "Campaigns", Name: "Michelle White", Title: "VP, Marketing", Email: "michelle.white@example.com", South: "True", Midwest: "True", Location: "Columbia, SC", Timezone: "ET" }].map(r=> ({...r, _Regions: deriveRegions(r)}));
        setData(sample);
      }finally{ setLoading(false); }
    })();
  },[]);

  const divisions = useMemo(()=> uniqSorted(data.map(r=>r.Division).filter(show) as string[]),[data]);
  const departments = useMemo(()=> uniqSorted(data.map(r=>r.Department).filter(show) as string[]),[data]);
  const teams = useMemo(()=> uniqSorted(data.map(r=>r.Team).filter(show) as string[]),[data]);

  const filtered = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return data.filter(r=>{
      if (division!=='All' && (r.Division||'')!==division) return false;
      if (department!=='All' && (r.Department||'')!==department) return false;
      if (team!=='All' && (r.Team||'')!==team) return false;
      if (region!=='All' && !(r._Regions||[]).includes(region)) return false;
      if (!q) return true;
      const hay = [r.Name,r.Title,r.Division,r.Department,r.Team,r.Email,r['Team Email'],r['Support Phone'],r.Location,r.Description,r.Notes].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    })
  },[data, division, department, team, region, query]);

  // Browse: exact name => drill to card (no auto-popup)
  useEffect(()=>{
    if (view !== 'browse') return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const matches = filtered.filter(r => (r.Name||'').trim().toLowerCase() === q);
    if (matches.length === 1) {
      const m = matches[0];
      setBrowseDiv(m.Division || null);
      setBrowseDept(m.Department || null);
      setBrowseTeam(m.Team || null);
      setSelected(null);
    }
  },[query, filtered, view]);

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
                <Input placeholder="Search name, team, title, email, notes…" value={query} onChange={(e)=>setQuery(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2">
              <FilterSelect label="Division" value={division} setValue={setDivision} options={divisions} />
              <FilterSelect label="Department" value={department} setValue={setDepartment} options={departments} />
              <FilterSelect label="Team" value={team} setValue={setTeam} options={teams} />
              <FilterSelect label="Region" value={region} setValue={setRegion} options={Array.from(REGION_KEYS) as unknown as string[]} />
            </div>
          </div>

          {view === 'browse' ? (
            <BrowseView
              data={filtered}
              selectedDiv={browseDiv}
              selectedDept={browseDept}
              selectedTeam={browseTeam}
              onDiv={(d)=>{ setBrowseDiv(d); setBrowseDept(null); setBrowseTeam(null); }}
              onDept={(d)=>{ setBrowseDept(d); setBrowseTeam(null); }}
              onTeam={(t)=> setBrowseTeam(t)}
              onBack={()=>{ if (browseTeam) setBrowseTeam(null); else if (browseDept) setBrowseDept(null); else if (browseDiv) setBrowseDiv(null); }}
              onRoot={()=>{ setBrowseDiv(null); setBrowseDept(null); setBrowseTeam(null); }}
              onDivCrumb={()=>{ setBrowseDept(null); setBrowseTeam(null); }}
              onDeptCrumb={()=>{ setBrowseTeam(null); }}
              onOpenCard={(r)=> setSelected(r)}
            />
          ) : view === 'cards' ? (
            <CardsView
              records={filtered}
              selected={selected}
              onToggle={(r) => setSelected(selected && sameRecord(selected, r) ? null : r)}
            />
          ) : (
            <TableView records={filtered} onOpen={(r)=> setSelected(r)} />
          )}

          <DetailsSheet record={selected} onOpenChange={(open)=>{ if (!open) setSelected(null); }} />
        </main>
      </div>
    </TooltipProvider>
  );
}

// ----------------------------- Views -----------------------------
function ViewToggle({ view, setView }: { view: 'cards'|'table'|'browse'; setView:(v:'cards'|'table'|'browse')=>void }){
  return (
    <div className="flex items-center gap-1 rounded-2xl border p-1 shadow-sm">
      <Button variant={view==='browse' ? 'default' : 'ghost'} size="sm" onClick={()=> setView('browse')}>
        <LayoutGrid className="w-4 h-4 mr-1" /> Browse Organization
      </Button>
      <Button variant={view==='cards' ? 'default' : 'ghost'} size="sm" onClick={()=> setView('cards')}>
        <LayoutGrid className="w-4 h-4 mr-1" /> Cards
      </Button>
      <Button variant={view==='table' ? 'default' : 'ghost'} size="sm" onClick={()=> setView('table')}>
        <Rows3 className="w-4 h-4 mr-1" /> Table
      </Button>
    </div>
  );
}

function FilterSelect({ label, value, setValue, options }:{ label:string; value:string; setValue:(v:string)=>void; options:string[] }){
  const opts = useMemo(()=> ['All', ...options.filter(Boolean)], [options]);
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <select className="w-full rounded-lg border px-3 py-2 bg-white h-10" value={value} onChange={(e)=> setValue(e.target.value)}>
        {opts.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CardsView({ records, selected, onToggle }: { records: DirectoryRecord[]; selected: DirectoryRecord | null; onToggle: (r: DirectoryRecord) => void }){
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {records.map((r, idx) => (
        <Card
          key={idx}
          className="rounded-2xl shadow-sm hover:shadow transition cursor-pointer h-full flex flex-col min-h-[240px]"
          onClick={() => onToggle(r)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <div className="font-medium leading-snug break-words">{r.Name || "(No name)"}</div>
              {show(r.Title) && (
                <div className="text-xs text-slate-500 font-normal mt-0.5 leading-snug break-words">
                  {r.Title}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-2 flex-1">
              <div className="text-sm text-slate-700">
                {([r.Division, r.Department, r.Team].some(show)) && (
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
              <div className="flex flex-wrap gap-1">
                {(r._Regions || []).map((reg) => (
                  <RegionPill key={reg} name={reg} />
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(r);
              }}
              className="w-full mt-4"
            >
              {selected && sameRecord(selected, r) ? "Close full contact info" : "Show full contact info"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableView({ records, onOpen }: { records: DirectoryRecord[]; onOpen:(r:DirectoryRecord)=>void }): JSX.Element {
  return (
    <div className="rounded-2xl border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r, i)=> (
            <TableRow key={i} className="cursor-pointer hover:bg-slate-50" onClick={()=> onOpen(r)}>
              <TableCell className="font-medium">{r.Name}</TableCell>
              <TableCell>{r.Title}</TableCell>
              <TableCell>{r.Department}</TableCell>
              <TableCell>{r.Team}</TableCell>
              <TableCell className="text-[#19557f]">{r.Email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ----------------------------- Browse (Divisions → Depts → Teams) -----------------------------
function BrowseView({ data, selectedDiv, selectedDept, selectedTeam, onDiv, onDept, onTeam, onBack, onOpenCard, onRoot, onDivCrumb, onDeptCrumb }:{
  data: DirectoryRecord[];
  selectedDiv: string | null;
  selectedDept: string | null;
  selectedTeam: string | null;
  onDiv: (d:string)=>void;
  onDept: (d:string)=>void;
  onTeam: (t:string)=>void;
  onBack: ()=>void;
  onOpenCard: (r:DirectoryRecord)=>void;
  onRoot?: ()=>void;
  onDivCrumb?: ()=>void;
  onDeptCrumb?: ()=>void;
}){
  const [orgVisible, setOrgVisible] = useState(true);

  const divisions = useMemo(()=> uniqSorted(data.map(r=> r.Division).filter(show) as string[]), [data]);
  const deptsInDiv = useMemo(()=> uniqSorted(data.filter(r=> selectedDiv ? r.Division===selectedDiv : true).map(r=> r.Department).filter(show) as string[]), [data, selectedDiv]);
  const teamsInDept = useMemo(()=> uniqSorted(data.filter(r=> (selectedDiv ? r.Division===selectedDiv : true) && (selectedDept ? r.Department===selectedDept : true)).map(r=> r.Team).filter(show) as string[]), [data, selectedDiv, selectedDept]);

  const peopleInDiv = useMemo(()=> data.filter(r=> selectedDiv ? r.Division===selectedDiv : false), [data, selectedDiv]);
  const peopleInDept = useMemo(()=> data.filter(r=> selectedDiv && selectedDept ? r.Division===selectedDiv && r.Department===selectedDept : false), [data, selectedDiv, selectedDept]);
  const peopleInTeam = useMemo(()=> data.filter(r=> selectedDiv && selectedDept && selectedTeam ? r.Division===selectedDiv && r.Department===selectedDept && r.Team===selectedTeam : false), [data, selectedDiv, selectedDept, selectedTeam]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-slate-600 gap-2">
          {!selectedDiv && <span className="font-medium">Divisions</span>}
          {selectedDiv && !selectedDept && (
            <>
              <button className="text-[#19557f] hover:underline" onClick={()=> onRoot ? onRoot() : onBack()}>Divisions</button>
              <span className="text-slate-400">›</span>
              <span className="font-medium">{selectedDiv}</span>
            </>
          )}
          {selectedDiv && selectedDept && !selectedTeam && (
            <>
              <button className="text-[#19557f] hover:underline" onClick={()=> onRoot ? onRoot() : onBack()}>Divisions</button>
              <span className="text-slate-400">›</span>
              <button className="text-[#19557f] hover:underline" onClick={()=> onDivCrumb ? onDivCrumb() : onBack()}>{selectedDiv}</button>
              <span className="text-slate-400">›</span>
              <span className="font-medium">{selectedDept}</span>
            </>
          )}
          {selectedDiv && selectedDept && selectedTeam && (
            <>
              <button className="text-[#19557f] hover:underline" onClick={()=> onRoot ? onRoot() : onBack()}>Divisions</button>
              <span className="text-slate-400">›</span>
              <button className="text-[#19557f] hover:underline" onClick={()=> onDivCrumb ? onDivCrumb() : onBack()}>{selectedDiv}</button>
              <span className="text-slate-400">›</span>
              <button className="text-[#19557f] hover:underline" onClick={()=> onDeptCrumb ? onDeptCrumb() : onBack()}>{selectedDept}</button>
              <span className="text-slate-400">›</span>
              <span className="font-medium">{selectedTeam}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=> setOrgVisible(v=>!v)}>{orgVisible ? "Hide org chart" : "Show org chart"}</Button>
          {(selectedDiv || selectedDept || selectedTeam) && (
            <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
          )}
        </div>
      </div>

      {!selectedDiv && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {divisions.map((v)=>{
            const allRows = data.filter(r=> r.Division===v);
            const deptCount = uniqSorted(allRows.map(r=> r.Department).filter(show) as string[]).length;
            return (
              <Card key={v} className="rounded-2xl shadow-sm hover:shadow cursor-pointer" onClick={()=> onDiv(v)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{v}</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-600">
                  {deptCount > 0 && <div>{deptCount} {deptCount===1 ? "department" : "departments"}</div>}
                  <div>{allRows.length} {allRows.length===1 ? "person" : "people"}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedDiv && !selectedDept && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-700">Departments</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptsInDiv.map((d)=>(
              <Card key={d} className="rounded-2xl shadow-sm hover:shadow cursor-pointer" onClick={()=> onDept(d)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{d}</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <div>{data.filter(r=> r.Division===selectedDiv && r.Department===d).length} people</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orgVisible && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Division Org Chart</div>
              <OrgMarketingChart rows={peopleInDiv} divisionName={selectedDiv!} onOpenCard={onOpenCard} />
            </div>
          )}
        </div>
      )}

      {selectedDiv && selectedDept && !selectedTeam && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-700">Teams</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamsInDept.map((t)=>(
              <Card key={t} className="rounded-2xl shadow-sm hover:shadow cursor-pointer" onClick={()=> onTeam(t)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{t}</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <div>{data.filter(r=> r.Division===selectedDiv && r.Department===selectedDept && r.Team===t).length} people</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orgVisible && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Department Org Chart</div>
              <OrgMarketingChart rows={peopleInDept} divisionName={selectedDiv!} onOpenCard={onOpenCard} />
            </div>
          )}
        </div>
      )}

      {selectedDiv && selectedDept && selectedTeam && (
        <div className="space-y-2">
          {orgVisible && (
            <>
              <div className="text-sm font-medium text-slate-700">Team Org Chart</div>
              <OrgMarketingChart rows={peopleInTeam} divisionName={selectedDiv!} onOpenCard={onOpenCard} />
            </>
          )}
          <TeamDetail data={peopleInTeam} onOpenCard={onOpenCard} />
        </div>
      )}
    </div>
  );
}

// ----------------------------- Org Chart -----------------------------
function OrgMarketingChart({ rows, divisionName, onOpenCard }:{ rows: DirectoryRecord[]; divisionName: string; onOpenCard:(r:DirectoryRecord)=>void }){
  const byId = useMemo(()=>{
    const m = new Map<string, DirectoryRecord>();
    rows.forEach(r=>{ const id = personId(r); if (id) m.set(id, r); });
    return m;
  }, [rows]);
  const children = useMemo(()=>{
    const m = new Map<string, DirectoryRecord[]>();
    rows.forEach(r=>{
      const pid = personId(r);
      if (!pid) return;
      const mid = managerId(r);
      const key = (mid && byId.has(mid)) ? mid : "__ROOT__";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    const rank = (t?: string)=>{
      if (!t) return 999;
      const T = t.toLowerCase();
      const order = ["chief","senior vice president","svp","senior vp","vice president","vp","assistant vice president","avp","director","manager","supervisor","lead","senior","associate","analyst","coordinator"];
      for (let i=0;i<order.length;i++){ if (T.includes(order[i])) return i; }
      return 900;
    };
    for (const [k, arr] of m.entries()){
      arr.sort((a,b)=> (rank(a.Title)-rank(b.Title)) || (sortOrderNum(a)-sortOrderNum(b)) || (normalize(a.Name).localeCompare(normalize(b.Name))));
    }
    return m;
  }, [rows, byId]);

  const roots = useMemo(()=> (children.get("__ROOT__") || []), [children]);
  if (roots.length === 0) return <div className="text-sm text-slate-600">No hierarchy data found.</div>;

  const top = useMemo(()=> {
    const order = ["chief","senior vice president","svp","senior vp","vice president","vp"];
    const score = (t?: string)=>{
      if (!t) return 999;
      const T = t.toLowerCase();
      for (let i=0;i<order.length;i++){ if (T.includes(order[i])) return i; }
      return 900;
    };
    return roots.slice().sort((a,b)=> (score(a.Title)-score(b.Title)) || normalize(a.Name).localeCompare(normalize(b.Name)))[0];
  }, [roots]);

  const directs = useMemo(()=> children.get(personId(top)!) || [], [children, top]);

  // top connectors
  const contRef = useRef<HTMLDivElement|null>(null);
  const topRef = useRef<HTMLDivElement|null>(null);
  const directRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setDirectRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) directRefs.current.set(id, el); else directRefs.current.delete(id);
  };
  const [svgBox, setSvgBox] = useState({w:0,h:0});
  const [sharedSegments, setSharedSegments] = useState<{x1:number;y1:number;x2:number;y2:number}[]>([]);

  const recomputeTopConnectors = () => {
    const c = contRef.current; const tp = topRef.current;
    if (!c || !tp) return;
    const crect = c.getBoundingClientRect();
    const trect = tp.getBoundingClientRect();
    const tCenterX = trect.left + trect.width/2 - crect.left;
    const tBottomY = trect.bottom - crect.top;

    const childCenters = Array.from(directRefs.current.values()).map(el=>{
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width/2 - crect.left, yTop: r.top - crect.top };
    });
    if (childCenters.length === 0) { setSharedSegments([]); return; }
    const minX = Math.min(...childCenters.map(c=>c.x));
    const maxX = Math.max(...childCenters.map(c=>c.x));
    const yMid = tBottomY + 24;

    const segs:any[] = [];
    segs.push({ x1: tCenterX, y1: tBottomY, x2: tCenterX, y2: yMid });
    segs.push({ x1: minX, y1: yMid, x2: maxX, y2: yMid });
    childCenters.forEach(cc=> segs.push({ x1: cc.x, y1: yMid, x2: cc.x, y2: cc.yTop }));
    setSharedSegments(segs);
    setSvgBox({ w: crect.width, h: crect.height });
  };

  useLayoutEffect(()=>{
    const raf = requestAnimationFrame(()=> recomputeTopConnectors());
    return ()=> cancelAnimationFrame(raf);
  }, [directs]);
  useEffect(()=>{
    const onResize = ()=> recomputeTopConnectors();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(()=> recomputeTopConnectors());
    if (contRef.current) ro.observe(contRef.current);
    return ()=> { window.removeEventListener('resize', onResize); ro.disconnect(); };
  }, []);

  const isFMD = (divisionName || "").toLowerCase().includes("field") && (divisionName || "").toLowerCase().includes("market");

  return (
    <div ref={contRef} className="relative w-full">
      <svg className="absolute inset-0 -z-10 pointer-events-none" width={svgBox.w} height={svgBox.h} viewBox={`0 0 ${svgBox.w} ${svgBox.h}`} preserveAspectRatio="none">
        {sharedSegments.map((s, i)=> (
          <path key={i} d={`M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`} fill="none" stroke="#CBD5E1" strokeWidth={2} />
        ))}
      </svg>

      <div className="flex justify-center mb-6">
        <div ref={topRef} className="inline-block w-64">
          <OrgMiniCard node={top} depth={0} onOpenCard={onOpenCard} />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-6 mb-8">
        {directs.map((n)=>{
          const id = personId(n)!;
          return (
            <div key={id} ref={setDirectRef(id)} className="inline-block">
              <div className="w-64">
                <OrgMiniCard node={n} depth={1} onOpenCard={onOpenCard} />
              </div>

              {isFMD ? (
                <FMDDepartmentGroups vp={n} allRows={rows} childrenMap={children} onOpenCard={onOpenCard} />
              ) : (
                <VerticalStackSubtree parentId={id} childrenMap={children} depth={2} onOpenCard={onOpenCard} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FMDDepartmentGroups({ vp, allRows, childrenMap, onOpenCard }:{ vp: DirectoryRecord; allRows: DirectoryRecord[]; childrenMap: Map<string, DirectoryRecord[]>; onOpenCard:(r:DirectoryRecord)=>void }){
  const vpId = personId(vp)!;

  const getDescendants = (id: string): DirectoryRecord[] => {
    const out: DirectoryRecord[] = [];
    const q = [id];
    const seen = new Set<string>();
    while (q.length) {
      const cur = q.shift()!;
      const kids = childrenMap.get(cur) || [];
      kids.forEach(k => {
        const pid = personId(k)!;
        if (!seen.has(pid)) { seen.add(pid); out.push(k); q.push(pid); }
      });
    }
    return out;
  };
  const descendants = useMemo(()=> getDescendants(vpId), [vpId, childrenMap]);

  const deptNames = useMemo(()=> uniqSorted(descendants.map(d=> d.Department).filter(show) as string[]), [descendants]);

  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const toggle = (dept: string) => setOpenDepts(s => ({ ...s, [dept]: !s[dept] }));

  return (
    <div className="mt-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {deptNames.map(dept => {
          const key = dept;
          const open = !!openDepts[key];
          return (
            <div key={key} className="relative">
              <div className="rounded-xl border bg-amber-50 border-amber-300 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-amber-900">{dept}</div>
                  <Button variant="ghost" size="sm" onClick={()=> toggle(dept)}>{open ? "Hide" : "Show"}</Button>
                </div>
              </div>
              {open && (
                <div className="mt-3">
                  <DepartmentSubtree vpId={vpId} department={dept} allRows={allRows} onOpenCard={onOpenCard} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentSubtree({ vpId, department, allRows, onOpenCard }:{ vpId: string; department: string; allRows: DirectoryRecord[]; onOpenCard:(r:DirectoryRecord)=>void }){
  const deptRows = useMemo(()=> allRows.filter(r=> r.Department === department), [allRows, department]);
  const byId = useMemo(()=>{
    const m = new Map<string, DirectoryRecord>();
    deptRows.forEach(r=>{ const id = personId(r); if (id) m.set(id, r); });
    return m;
  }, [deptRows]);
  const children = useMemo(()=>{
    const m = new Map<string, DirectoryRecord[]>();
    deptRows.forEach(r=>{
      const pid = personId(r);
      if (!pid) return;
      const mid = managerId(r);
      const key = (mid && byId.has(mid)) ? mid : "__ROOT__";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    return m;
  }, [deptRows, byId]);

  const directDeptReports = useMemo(()=> (children.get(vpId) || []), [children, vpId]);

  return (
    <div className="pl-6">
      {directDeptReports.length === 0 ? (
        <div className="text-sm text-slate-600">No records in this department.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {directDeptReports.map(dr => {
            const pid = personId(dr)!;
            return (
              <div key={pid}>
                <OrgMiniCard node={dr} depth={2} onOpenCard={onOpenCard} />
                <VerticalStackSubtree parentId={pid} childrenMap={children} depth={3} onOpenCard={onOpenCard} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VerticalStackSubtree({ parentId, childrenMap, depth, onOpenCard }:{ parentId:string; childrenMap: Map<string, DirectoryRecord[]>; depth: number; onOpenCard:(r:DirectoryRecord)=>void }){
  const kids = (childrenMap.get(parentId) || []).slice();
  if (kids.length === 0) return null;

  return (
    <div className="relative mt-6 ml-10">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300" />
      <div className="space-y-3">
        {kids.map((k)=>{
          const id = personId(k)!;
          const hasSub = (childrenMap.get(id) || []).length > 0;
          return (
            <div key={id} className="relative pl-4">
              <div className="absolute left-0 top-5 w-4 h-px bg-slate-300" />
              <OrgMiniCard node={k} depth={depth} onOpenCard={onOpenCard} />
              {hasSub && (
                <div className="ml-8">
                  <VerticalStackSubtree parentId={id} childrenMap={childrenMap} depth={depth+1} onOpenCard={onOpenCard} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrgMiniCard({ node, depth, onOpenCard }:{ node: DirectoryRecord; depth: number; onOpenCard:(r:DirectoryRecord)=>void }){
  return (
    <div className={`rounded-xl border px-3 py-2 cursor-pointer hover:shadow w-64 ${hierarchyClasses(depth)}`} onClick={()=> onOpenCard(node)}>
      <div className="font-medium leading-snug break-words text-center">{node.Name}</div>
      {node.Title && <div className="text-xs leading-snug break-words text-center opacity-90">{node.Title}</div>}
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {(node._Regions || []).map(reg => <RegionPill key={reg} name={reg} />)}
      </div>
    </div>
  );
}

// ----------------------------- Team Detail -----------------------------
function TeamDetail({ data, onOpenCard }:{ data: DirectoryRecord[]; onOpenCard:(r:DirectoryRecord)=>void }){
  const [tab, setTab] = useState<'contacts'|'org'>('contacts');
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant={tab==='contacts'?'default':'ghost'} size="sm" onClick={()=> setTab('contacts')}>Contacts</Button>
        <Button variant={tab==='org'?'default':'ghost'} size="sm" onClick={()=> setTab('org')}>Org Chart</Button>
      </div>
      {tab === 'contacts' ? (
        <CardsView records={data} selected={null} onToggle={onOpenCard} />
      ) : (
        <OrgMarketingChart rows={data} divisionName={(data[0]?.Division || "")} onOpenCard={onOpenCard} />
      )}
    </div>
  );
}

// ----------------------------- Details -----------------------------
function DetailsSheet({ record, onOpenChange }:{ record: DirectoryRecord | null; onOpenChange: (open:boolean)=>void }){
  if (!record) return null;
  const isDesktop = useIsDesktop();

  const HeaderBlock = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-lg font-semibold">{record?.Name || 'Details'}</div>
        {(record._Regions?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">{record._Regions!.map((reg)=> <RegionPill key={reg} name={reg}/>)}</div>
        )}
      </div>
      <button aria-label="Close details" className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100" onClick={() => onOpenChange(false)}>
        <X className="w-5 h-5" />
      </button>
    </div>
  );

  const BodyBlock = (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[75vh] flex-1">
      <div>
        {show(record.Title) && <div className="text-slate-900 font-medium">{record.Title}</div>}
        {([record.Division, record.Department, record.Team].some(show)) && (
          <div className="text-slate-700">
            {[record.Division, record.Department, record.Team].filter(show).join(' · ')}
          </div>
        )}
        {show(record.Location) && (
          <div className="flex items-center gap-2 text-slate-700 mt-1">
            <MapPin className="w-4 h-4" /> {record.Location}
            {show(record.Timezone) ? <span className="text-slate-500">· {record.Timezone}</span> : null}
          </div>
        )}
        {([record.Days, record.Hours].some(show)) && (
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4" /> {(show(record.Days) ? record.Days : '')}
            {show(record.Hours) ? ` · ${record.Hours}` : null}
          </div>
        )}
      </div>

      <ContactSection record={record} />

      <Separator />
      <ResourceList record={record} />
      {show(record.Notes) && (
        <div className="bg-slate-50 rounded-xl p-3 text-sm">
          <div className="font-medium mb-1">Notes</div>
          <div className="whitespace-pre-wrap">{record.Notes}</div>
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={!!record} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl p-0 z-[200] overflow-hidden flex flex-col">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="sr-only">Details</DialogTitle>
            {HeaderBlock}
          </DialogHeader>
          {BodyBlock}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={!!record} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 z-[200] overflow-hidden flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="sr-only">Details</SheetTitle>
          {HeaderBlock}
        </SheetHeader>
        {BodyBlock}
      </SheetContent>
    </Sheet>
  );
}

function ContactSection({ record }:{ record: DirectoryRecord }){
  const hasEmail = !!record.Email || !!record["Team Email"];
  const hasPhone = !!record["Mobile #"] || !!record["Office #"] || !!record["Support Phone"];
  if (!hasEmail && !hasPhone) return null;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-700">Contact</div>

      {hasEmail && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Email</div>
          <div className="rounded-lg border divide-y divide-slate-200">
            {record.Email && (
              <a href={mailto(record.Email)!} className="flex items-center gap-2 px-3 py-2 text-[#19557f] hover:underline">
                <Mail className="w-4 h-4" />
                <span className="truncate">{record.Email}</span>
              </a>
            )}
            {record["Team Email"] && (
              <a href={mailto(record["Team Email"])!} className="flex items-center gap-2 px-3 py-2 text-[#19557f] hover:underline">
                <Mail className="w-4 h-4" />
                <span className="truncate">{record["Team Email"]}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {hasPhone && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Phone</div>
          <div className="rounded-lg border divide-y divide-slate-200">
            {record["Mobile #"] && (
              <a href={telLink(record["Mobile #"])!} className="flex items-center gap-2 px-3 py-2 text-[#19557f] hover:underline">
                <Phone className="w-4 h-4" />
                <span className="truncate">{record["Mobile #"]}</span>
              </a>
            )}
            {record["Office #"] && (
              <a href={telLink(record["Office #"])!} className="flex items-center gap-2 px-3 py-2 text-[#19557f] hover:underline">
                <Phone className="w-4 h-4" />
                <span className="truncate">{record["Office #"]}</span>
              </a>
            )}
            {record["Support Phone"] && (
              <a href={telLink(record["Support Phone"])!} className="flex items-center gap-2 px-3 py-2 text-[#19557f] hover:underline">
                <Phone className="w-4 h-4" />
                <span className="truncate">{record["Support Phone"]}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourceList({ record }:{ record: DirectoryRecord }){
  const resources = [
    { label: 'ChangeGear Self-Service Portal', url: record['ChangeGear Self-Service Portal'], desc: record['ChangeGear Self-Service Portal Description'] },
    { label: 'Enrollment Technology Hub', url: record['Enrollment Technology Hub'], desc: record['Enrollment Technology Hub Description'] },
    { label: 'Propr Resource', url: record['Propr Resource'] },
    { label: 'Plan Administrator Support', url: record['Plan Administrator Support'] },
    { label: 'Field Office Representatives Support', url: record['Field Office Representatives Support'] },
    { label: 'Claim Forms/Doc Support', url: record['Claim Forms/Doc Support'] },
    { label: 'VB Claims', url: record['VB Claims'] },
    { label: 'Dental Claims', url: record['Dental Claims'] },
    { label: 'Vision Claims', url: record['Vision Claims'] },
    { label: 'Disability + A&H Claims', url: record['Disability + A&H Claims'] },
    { label: 'Special Risk Claims (Cancer/CI/Life)', url: record['Special Risk Claims (Cancer/CI/Life)'] },
    { label: 'Life', url: record['Life'] },
    { label: 'Supplemental Health (Accident, Critical Illness, Cancer, Hospital Indemnity)', url: record['Supplemental Health (Accident, Critical Illness, Cancer, Hospital Indemnity)'] },
    { label: 'Disability Plus / Paid Leave', url: record['Disability Plus / Paid Leave'] },
    { label: 'Dental', url: record['Dental'] },
    { label: 'Resource', url: record.Resource, desc: record.Description },
  ];
  const isTruthy = (v?: string) => !!(v && !/^(false|no|n|0|na|n\/a|n\.a\.?|none|tbd|to be determined|\-|--)$/i.test(v.trim()));
  const visible = resources.filter(r=> isTruthy(r.url) || isTruthy(r.desc));
  if (visible.length===0) return null;
  return (
    <div className="space-y-2">
      <div className="font-medium">Resources</div>
      <div className="space-y-2">
        {visible.map((res, i)=>(
          <div key={i} className="rounded-xl border p-3 hover:bg-slate-50 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium break-words">{res.label}</div>
              {res.desc && <div className="text-xs text-slate-600 break-words">{res.desc}</div>}
              {res.url && (
                <a className="inline-flex items-center gap-2 text-[#19557f] hover:underline break-all" href={res.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">{res.url}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportMenu({ records }:{ records: DirectoryRecord[] }){
  const exportJSON = () => { const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); triggerDownload(url, 'directory-export.json'); };
  const exportCSV = () => { const csv = Papa.unparse(records); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); triggerDownload(url, 'directory-export.csv'); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant='outline' size='sm'><Download className='w-4 h-4 mr-2'/> Export</Button></DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Export filtered</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onClick={exportJSON}>JSON</DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV}>CSV</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminTools({ data, setData }:{ data: DirectoryRecord[]; setData:(d:DirectoryRecord[])=>void }){
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant='outline' size='sm'><Settings className='w-4 h-4 mr-2'/> Admin</Button></DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader><DialogTitle>Admin Tools</DialogTitle></DialogHeader>
        <Tabs defaultValue='import'>
          <TabsList className='grid grid-cols-3 gap-2'>
            <TabsTrigger value='import'>Import CSV</TabsTrigger>
            <TabsTrigger value='qa'>Data QA</TabsTrigger>
            <TabsTrigger value='about'>About</TabsTrigger>
          </TabsList>
          <TabsContent value='import' className='pt-3'>
            <CsvImport onParsed={(rows)=> setData(rows.map(r=> ({...r, _Regions: deriveRegions(r)})))} />
          </TabsContent>
          <TabsContent value='qa' className='pt-3'>
            <DataQA records={data} />
          </TabsContent>
          <TabsContent value='about' className='pt-3 text-sm text-slate-700'>
            <p className='mb-2'>Upload a CSV to update the directory. Parsed rows appear in the app immediately (client-side only).</p>
            <p className='mb-2'>Use the <em>Reload data</em> button to re-fetch <code>/data/directory.json</code> with cache-busting.</p>
            <p className='mb-2'>Admin is hidden by default — append <code>?admin=1</code> to the URL or set <code>VITE_ENABLE_ADMIN=true</code>.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CsvImport({ onParsed }:{ onParsed:(rows:DirectoryRecord[])=>void }){
  const [fileName, setFileName] = useState<string>('');
  const [rows, setRows] = useState<DirectoryRecord[]|null>(null);
  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<DirectoryRecord>(file, { header:true, skipEmptyLines:true, complete:(res)=>{
      const clean = (res.data || []).map((r:any)=> trimAll(r));
      setRows(clean);
      onParsed(clean.map((r:any)=> ({...r, _Regions: deriveRegions(r)})));
    }});
  };
  const downloadJson = () => { if (!rows) return; const blob = new Blob([JSON.stringify(rows, null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); triggerDownload(url, 'directory.json'); };
  return (
    <div className='space-y-3'>
      <div><Input type='file' accept='.csv' onChange={(e)=> e.target.files?.[0] && handleFile(e.target.files[0])}/>{fileName && <div className='text-xs text-slate-600 mt-1'>Loaded: {fileName}</div>}</div>
      <div className='flex items-center gap-2'>
        <Button variant='secondary' onClick={downloadJson} disabled={!rows}><Download className='w-4 h-4 mr-2'/> Download JSON</Button>
        <Button variant='outline' onClick={()=> setRows(null)} disabled={!rows}>Clear</Button>
      </div>
      {rows && <div className='text-xs text-slate-600'>Parsed {rows.length} row(s).</div>}
    </div>
  );
}

function DataQA({ records }:{ records: DirectoryRecord[] }){
  const messages = useMemo(()=>{
    const out:string[] = [];
    const ids = new Set<string>();
    records.forEach((r,i)=>{
      const id = (personId(r) || '').trim();
      if (!id) out.push(`Row ${i+1}: Missing Person ID/Email`); else ids.add(id);
      const email = (r.Email||'').trim(); if (email && email.indexOf('@') === -1) out.push(`Row ${i+1}: Email looks invalid (${email})`);
    });
    records.forEach((r,i)=>{ const mid = (managerId(r) || '').trim(); if (mid && !records.some(rr=> personId(rr)===mid)) out.push(`Row ${i+1}: Manager ID '${mid}' not found in dataset`); });
    return out;
  },[records]);
  if (!messages.length) return <div className='text-sm text-slate-600'>No data issues found.</div>;
  return (
    <ul className='text-sm text-slate-700 list-disc pl-5 space-y-1'>
      {messages.map((m,i)=> <li key={i}>{m}</li>)}
    </ul>
  );
}

export { };
