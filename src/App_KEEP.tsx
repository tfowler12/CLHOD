import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Mail, Phone, Search, Download, ExternalLink, MapPin, Clock, Settings, LayoutGrid, Rows3, X } from "lucide-react";
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
const REGION_KEYS = ["South", "Southeast", "Midwest", "Northeast", "Pacific"] as const;
const REGION_COLORS: Record<string, string> = {
  South: "#092C48",
  Southeast: "#B72B33",
  Northeast: "#74922C",
  Midwest: "#007C85",
  Pacific: "#D46201",
};
const REGION_OPTIONS: string[] = ["All", ...Array.from(REGION_KEYS).map(String)];

// ----------------------------- Helpers -----------------------------
const truthyFlag = (v?: string) => {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["y","yes","true","1","✓","x"].includes(s);
};
const deriveRegions = (r: DirectoryRecord) => REGION_KEYS.filter(k => truthyFlag(r[k])).map(k=>k);
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

function RegionPill({ name }:{ name:string }){
  const color = REGION_COLORS[name] || '#5B7183';
  const style: React.CSSProperties = { color, borderColor: color, borderWidth: 1 };
  return <span aria-label={`Region ${name}`} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white border" style={style}>{name}</span>;
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
        const sample: DirectoryRecord[] = [{ Division: "Customer Success", Department: "Claims", Team: "Disability", Name: "Jane Doe", Title: "Claims Team Lead", Email: "jane.doe@example.com", South: "True", Midwest: "True", Location: "Greenville, SC", Timezone: "ET" }].map(r=> ({...r, _Regions: deriveRegions(r)}));
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="" className="w-8 h-8 rounded-xl" />
              <h1 className="text-xl font-semibold" style={{color:'#19557f'}}>Colonial Life Home Office Directory</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ViewToggle view={view} setView={setView} />
              {isAdmin && <AdminTools data={data} setData={setData} />}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Search name, team, title, email, notes…" value={query} onChange={(e)=>setQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2">
              <FilterSelect label="Division" value={division} setValue={setDivision} options={divisions} />
              <FilterSelect label="Department" value={department} setValue={setDepartment} options={departments} />
              <FilterSelect label="Team" value={team} setValue={setTeam} options={teams} />
              <FilterSelect label="Region" value={region} setValue={setRegion} options={REGION_OPTIONS} />
            </div>
          </div>

          {view === 'browse' ? (
            <BrowseView
              data={data}
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
      <select className="w-full rounded-lg border px-3 py-2 bg-white" value={value} onChange={(e)=> setValue(e.target.value)}>
        {opts.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CardsView({ records, selected, onToggle }: { records: DirectoryRecord[]; selected: DirectoryRecord | null; onToggle: (r: DirectoryRecord) => void }){
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {records.map((r, idx)=>(
        <Card key={idx} className="rounded-2xl shadow-sm hover:shadow transition cursor-pointer" onClick={()=> onToggle(r)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <div className="font-medium leading-snug break-words">{r.Name || '(No name)'}</div>
              {show(r.Title) && <div className="text-xs text-slate-500 font-normal mt-0.5 leading-snug break-words">{r.Title}</div>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-slate-700">
              {([r.Division, r.Department, r.Team].some(show)) && (
                <div className="break-words">{[r.Division, r.Department, r.Team].filter(show).join(' · ')}</div>
              )}
              {show(r.Location) && (
                <div className="flex items-center gap-1 text-slate-600"><MapPin className="w-4 h-4" /> {r.Location}</div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {(r._Regions || []).map(reg=> <RegionPill key={reg} name={reg} />)}
            </div>
            <div className="flex flex-col gap-1 pt-1">
              {r.Email && (
                <a href={mailto(r.Email)!} onClick={(e)=>e.stopPropagation()} className="inline-flex items-center gap-2 text-[#19557f] hover:underline"><Mail className="w-4 h-4" /><span className="break-words">{r.Email}</span></a>
              )}
              {r['Mobile #'] && (
                <a href={telLink(r['Mobile #'])!} onClick={(e)=>e.stopPropagation()} className="inline-flex items-center gap-2 text-[#19557f] hover:underline"><Phone className="w-4 h-4" /><span className="break-words">{r['Mobile #']}</span></a>
              )}
              {r['Office #'] && (
                <a href={telLink(r['Office #'])!} onClick={(e)=>e.stopPropagation()} className="inline-flex items-center gap-2 text-[#19557f] hover:underline"><Phone className="w-4 h-4" /><span className="break-words">{r['Office #']}</span></a>
              )}
              <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); onToggle(r); }}>
                {selected && sameRecord(selected, r) ? 'Close full contact info' : 'Show full contact info'}
              </Button>
            </div>
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
  // Collections per level
  const divisions = useMemo(()=> uniqSorted(data.map(r=> r.Division).filter(show) as string[]), [data]);
  const deptsInDiv = useMemo(()=> uniqSorted(data.filter(r=> selectedDiv ? r.Division===selectedDiv : true).map(r=> r.Department).filter(show) as string[]), [data, selectedDiv]);
  const teamsInDept = useMemo(()=> uniqSorted(data.filter(r=> (selectedDiv ? r.Division===selectedDiv : true) && (selectedDept ? r.Department===selectedDept : true)).map(r=> r.Team).filter(show) as string[]), [data, selectedDiv, selectedDept]);

  const peopleInDiv = useMemo(()=> data.filter(r=> selectedDiv ? r.Division===selectedDiv : false), [data, selectedDiv]);
  const peopleInDept = useMemo(()=> data.filter(r=> selectedDiv && selectedDept ? r.Division===selectedDiv && r.Department===selectedDept : false), [data, selectedDiv, selectedDept]);
  const peopleInTeam = useMemo(()=> data.filter(r=> selectedDiv && selectedDept && selectedTeam ? r.Division===selectedDiv && r.Department===selectedDept && r.Team===selectedTeam : false), [data, selectedDiv, selectedDept, selectedTeam]);

  // Stats for cards
  const divStats = useMemo(()=>{
    const m = new Map<string, {depts:number; people:number}>();
    divisions.forEach(v=>{
      const rows = data.filter(r=> r.Division===v);
      const depts = uniqSorted(rows.map(r=> r.Department).filter(show) as string[]).length;
      m.set(v, { depts, people: rows.length });
    });
    return m;
  }, [data, divisions]);

  const deptStats = useMemo(()=>{
    const m = new Map<string, {teams:number; people:number}>();
    deptsInDiv.forEach(d=>{
      const rows = data.filter(r=> (!selectedDiv || r.Division===selectedDiv) && r.Department===d);
      const teams = uniqSorted(rows.map(r=> r.Team).filter(show) as string[]).length;
      m.set(d, { teams, people: rows.length });
    });
    return m;
  }, [data, deptsInDiv, selectedDiv]);

  // Leaders (roots) if you want to show a slim strip later
  const computeRoots = (rows: DirectoryRecord[]) => {
    const ids = new Set<string>();
    rows.forEach(r=> { const id = personId(r); if (id) ids.add(id); });
    const roots = rows.filter(r=>{ const mid = managerId(r); return !mid || !ids.has(mid); });
    return roots.sort((a,b)=> (sortOrderNum(a)-sortOrderNum(b)) || (a.Name||'').localeCompare(b.Name||''));
  };
  const deptRoots = useMemo(()=> computeRoots(peopleInDept), [peopleInDept]);

  // Sticky anchors
  const teamsRef = useRef<HTMLDivElement|null>(null);
  const orgRef = useRef<HTMLDivElement|null>(null);
  const divDeptsRef = useRef<HTMLDivElement|null>(null);
  const divOrgRef = useRef<HTMLDivElement|null>(null);

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
        {(selectedDiv || selectedDept || selectedTeam) && (
          <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
        )}
      </div>

      {/* Root view: Divisions grid (hide divisions without departments) */}
      {!selectedDiv && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {divisions.filter(v=> (divStats.get(v)?.depts || 0) > 0).map((v)=>{
            const stats = divStats.get(v)!;
            return (
              <Card key={v} className="rounded-2xl shadow-sm hover:shadow cursor-pointer" onClick={()=> onDiv(v)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{v}</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <div>{stats.depts} departments</div>
                  <div>{stats.people} people</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Division view: departments first, then org chart with sticky subnav */}
      {selectedDiv && !selectedDept && (
        <div className="space-y-4">
          <div className="sticky top-16 z-20 bg-white/80 backdrop-blur border rounded-xl px-2 py-1 mb-2 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={()=> divDeptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Departments</Button>
            <Button variant="ghost" size="sm" onClick={()=> divOrgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Org Chart</Button>
          </div>

          <div ref={divDeptsRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptsInDiv.map((d)=>(
              <Card key={d} className="rounded-2xl shadow-sm hover:shadow cursor-pointer" onClick={()=> onDept(d)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{d}</CardTitle></CardHeader>
                <CardContent className="text-sm text-slate-600">
                  {deptStats.get(d)?.teams ? <div>{deptStats.get(d)!.teams} teams</div> : null}
                  <div>{deptStats.get(d)?.people ?? 0} people</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div ref={divOrgRef} className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Division Org Chart</div>
            <OrgChart team={peopleInDiv} onOpenCard={onOpenCard} />
          </div>
        </div>
      )}

      {/* Department view: teams first, then (optional) leader strip, then org chart + sticky subnav */}
      {selectedDiv && selectedDept && !selectedTeam && (
        teamsInDept.length === 0 ? (
          <TeamDetail data={peopleInDept} onOpenCard={onOpenCard} />
        ) : (
          <div className="space-y-4">
            <div className="sticky top-16 z-20 bg-white/80 backdrop-blur border rounded-xl px-2 py-1 mb-2 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={()=> teamsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Teams</Button>
              <Button variant="ghost" size="sm" onClick={()=> orgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Org Chart</Button>
            </div>

            <div ref={teamsRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {teamsInDept.map((t)=>(
                <Card key={t} className="rounded-2xl shadow-sm hover:shadow cursor-pointer" onClick={()=> onTeam(t)}>
                  <CardHeader className="pb-2"><CardTitle className="text-base">{t}</CardTitle></CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    <div>{data.filter(r=> r.Division===selectedDiv && r.Department===selectedDept && r.Team===t).length} people</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {deptRoots.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Department Leaders</div>
                <CardsView records={deptRoots} selected={null} onToggle={onOpenCard} />
              </div>
            )}

            <div ref={orgRef} className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Department Org Chart</div>
              <OrgChart team={peopleInDept} onOpenCard={onOpenCard} />
            </div>
          </div>
        )
      )}

      {/* Team view */}
      {selectedDiv && selectedDept && selectedTeam && (
        <TeamDetail data={peopleInTeam} onOpenCard={onOpenCard} />
      )}
    </div>
  );
}

// ----------------------------- Team Detail (Contacts / Org) -----------------------------
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
        <OrgChart team={data} onOpenCard={onOpenCard} />
      )}
    </div>
  );
}

// ----------------------------- Org Chart (BFS rows + connectors) -----------------------------
function OrgChart(
  { team, onOpenCard, collapsedHeight = 420 }:
  { team: DirectoryRecord[]; onOpenCard:(r:DirectoryRecord)=>void; collapsedHeight?: number }
){
  const [expanded, setExpanded] = useState(false);

  const byId = useMemo(() => {
    const m = new Map<string, DirectoryRecord>();
    team.forEach(r => { const id = personId(r); if (id) m.set(id, r); });
    return m;
  }, [team]);

  const children = useMemo(() => {
    const m = new Map<string, DirectoryRecord[]>();
    team.forEach(r=>{
      const mid = managerId(r);
      const id = personId(r);
      if (!id) return;
      const key = mid && byId.has(mid) ? mid : "__ROOT__";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    });
    for (const arr of m.values()) {
      arr.sort((a,b)=> (sortOrderNum(a)-sortOrderNum(b)) || (a.Name||"").localeCompare(b.Name||""));
    }
    return m;
  }, [team, byId]);

  const roots = useMemo(() => (children.get("__ROOT__") || []), [children]);

  const levels = useMemo(() => {
    const lvls: DirectoryRecord[][] = [];
    const q: { node: DirectoryRecord; depth: number }[] = [];
    const seen = new Set<string>();
    roots.forEach(r => q.push({ node:r, depth:0 }));
    while (q.length) {
      const { node, depth } = q.shift()!;
      const id = personId(node);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      if (!lvls[depth]) lvls[depth] = [];
      lvls[depth].push(node);
      (children.get(id) || []).forEach(k => q.push({ node:k, depth:depth+1 }));
    }
    return lvls;
  }, [roots, children]);

  const wrapperStyle: React.CSSProperties = expanded
    ? {}
    : { maxHeight: collapsedHeight, overflow: "hidden", position: "relative" };

  return (
    <div className="overflow-auto">
      <div className="min-w-[720px] p-2" style={wrapperStyle}>
        {levels.length === 0 ? (
          <div className="text-sm text-slate-600">No hierarchy data found for this team.</div>
        ) : (
          <div className="space-y-8">
            {levels.map((row, i) => (
              <div key={i} className="relative">
                {i < levels.length - 1 && (
                  <div className="absolute left-8 right-8 top-[calc(100%+0.25rem)] h-px bg-slate-300" />
                )}
                <div className="flex flex-wrap items-start justify-center gap-6">
                  {row.map(n => (
                    <div key={personId(n)} className="flex flex-col items-center">
                      <div
                        className="inline-block w-64 rounded-xl border bg-white shadow-sm px-3 py-2 cursor-pointer hover:shadow"
                        onClick={() => onOpenCard(n)}
                      >
                        <div className="font-medium leading-snug break-words">{n.Name}</div>
                        {show(n.Title) && (
                          <div className="text-xs text-slate-600 leading-snug break-words">{n.Title}</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(n._Regions || []).map(reg => <RegionPill key={reg} name={reg} />)}
                        </div>
                      </div>
                      {i < levels.length - 1 && <div className="h-4 w-px bg-slate-300" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {!expanded && levels.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {levels.length > 0 && (
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="sm" onClick={()=> setExpanded(x=>!x)}>
            {expanded ? "Collapse org" : "Show full org"}
          </Button>
        </div>
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
    <div className="p-4 max-h-[75vh] overflow-y-auto space-y-4">
      <div>
        {show(record.Title) && <div className="text-slate-900 font-medium">{record.Title}</div>}
        {([record.Division, record.Department, record.Team].some(show)) && (
          <div className="text-slate-700">{[record.Division, record.Department, record.Team].filter(show).join(' · ')}</div>
        )}
        {show(record.Location) && (
          <div className="flex items-center gap-2 text-slate-700 mt-1"><MapPin className="w-4 h-4" /> {record.Location} {show(record.Timezone) ? <span className="text-slate-500">· {record.Timezone}</span> : null}</div>
        )}
        {([record.Days, record.Hours].some(show)) && (
          <div className="flex items-center gap-2 text-slate-700"><Clock className="w-4 h-4" /> {(show(record.Days) ? record.Days : '')} {show(record.Hours) ? ` · ${record.Hours}` : null}</div>
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
        <DialogContent className="sm:max-w-xl p-0 z-[200]">
          <div className="p-4 border-b">{HeaderBlock}</div>
          {BodyBlock}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={!!record} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="p-0 z-[200]">
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

// ----------------------------- Export & Admin -----------------------------
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
