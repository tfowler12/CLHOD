import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Search, Download, ExternalLink, MapPin, Clock, Settings, LayoutGrid, Rows3, X, Users, Building2, Filter, ChevronDown, Star, Copy, Check } from "lucide-react";
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
  _isFavorite?: boolean;
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

// Enhanced favorites management
const FAVORITES_KEY = 'colonial_directory_favorites';
const getFavorites = (): Set<string> => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(FAVORITES_KEY) || '[]');
    return new Set(stored);
  } catch {
    return new Set();
  }
};

const saveFavorites = (favorites: Set<string>) => {
  try {
    sessionStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Silently fail if storage is unavailable
  }
};

// Copy to clipboard helper
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
};

function RegionPill({ name }:{ name:string }){
  const color = REGION_COLORS[name] || '#5B7183';
  const style: React.CSSProperties = { color, borderColor: color, borderWidth: 1 };
  return <span aria-label={`Region ${name}`} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-white border" style={style}>{name}</span>;
}

// Enhanced stats component
function StatsBar({ records }: { records: DirectoryRecord[] }) {
  const stats = useMemo(() => {
    const divisions = new Set(records.map(r => r.Division).filter(show));
    const departments = new Set(records.map(r => r.Department).filter(show));
    const teams = new Set(records.map(r => r.Team).filter(show));
    const regions = new Set(records.flatMap(r => r._Regions || []));
    
    return {
      people: records.length,
      divisions: divisions.size,
      departments: departments.size,
      teams: teams.size,
      regions: regions.size
    };
  }, [records]);

  return (
    <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>{stats.people} people</span>
      </div>
      <div className="flex items-center gap-1">
        <Building2 className="w-4 h-4" />
        <span>{stats.divisions} divisions</span>
      </div>
      <div>·</div>
      <div>{stats.departments} departments</div>
      <div>·</div>
      <div>{stats.teams} teams</div>
      <div>·</div>
      <div>{stats.regions} regions</div>
    </div>
  );
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [view, setView] = useState<'cards'|'table'|'browse'>('browse');
  const [browseDiv, setBrowseDiv] = useState<string | null>(null);
  const [browseDept, setBrowseDept] = useState<string | null>(null);
  const [browseTeam, setBrowseTeam] = useState<string | null>(null);
  const [selected, setSelected] = useState<DirectoryRecord|null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const isAdmin = useMemo(()=>{
    try { 
      const qp = new URLSearchParams(window.location.search); 
      return qp.get('admin') === '1'; 
    } catch { 
      return false; 
    }
  },[]);

  // Load favorites on mount
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((record: DirectoryRecord) => {
    const id = personId(record);
    if (!id) return;
    
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

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
        const sample: DirectoryRecord[] = [
          { Division: "Customer Success", Department: "Claims", Team: "Disability", Name: "Jane Doe", Title: "Claims Team Lead", Email: "jane.doe@example.com", South: "True", Midwest: "True", Location: "Greenville, SC", Timezone: "ET" },
          { Division: "Technology", Department: "Engineering", Team: "Platform", Name: "John Smith", Title: "Senior Software Engineer", Email: "john.smith@example.com", Northeast: "True", Pacific: "True", Location: "Remote", Timezone: "ET" },
          { Division: "Sales", Department: "Enterprise", Team: "Strategic Accounts", Name: "Sarah Johnson", Title: "Account Executive", Email: "sarah.johnson@example.com", Southeast: "True", Location: "Atlanta, GA", Timezone: "ET" }
        ].map(r=> ({...r, _Regions: deriveRegions(r)}));
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
      if (showFavoritesOnly && !favorites.has(personId(r) || '')) return false;
      if (!q) return true;
      const hay = [r.Name,r.Title,r.Division,r.Department,r.Team,r.Email,r['Team Email'],r['Support Phone'],r.Location,r.Description,r.Notes].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    })
  },[data, division, department, team, region, query, showFavoritesOnly, favorites]);

  const clearFilters = () => {
    setQuery("");
    setDivision("All");
    setDepartment("All");
    setTeam("All");
    setRegion("All");
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = query || division !== "All" || department !== "All" || team !== "All" || region !== "All" || showFavoritesOnly;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/90 border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/favicon.ico" alt="" className="w-8 h-8 rounded-xl" />
              <h1 className="text-xl font-semibold" style={{color:'#19557f'}}>Colonial Life Home Office Directory</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ViewToggle view={view} setView={setView} />
              <ExportMenu records={filtered} />
              {isAdmin && <AdminTools data={data} setData={setData} />}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="space-y-3">
            {/* Enhanced search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    placeholder="Search name, team, title, email, notes…" 
                    value={query} 
                    onChange={(e)=>setQuery(e.target.value)} 
                    className="pl-9" 
                  />
                </div>
              </div>
              <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-5 gap-2">
                <FilterSelect label="Division" value={division} setValue={setDivision} options={divisions} />
                <FilterSelect label="Department" value={department} setValue={setDepartment} options={departments} />
                <FilterSelect label="Team" value={team} setValue={setTeam} options={teams} />
                <FilterSelect label="Region" value={region} setValue={setRegion} options={REGION_OPTIONS} />
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-600">Favorites</div>
                  <Button 
                    variant={showFavoritesOnly ? "default" : "outline"} 
                    size="sm" 
                    className="w-full h-10"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  >
                    <Star className={`w-4 h-4 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    {showFavoritesOnly ? 'Favorites' : 'All'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter controls and stats */}
            <div className="flex items-center justify-between gap-4">
              <StatsBar records={filtered} />
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <Filter className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
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
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          ) : view === 'cards' ? (
            <CardsView
              records={filtered}
              selected={selected}
              onToggle={(r) => setSelected(selected && sameRecord(selected, r) ? null : r)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <TableView 
              records={filtered} 
              onOpen={(r)=> setSelected(r)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}

          <DetailsSheet 
            record={selected} 
            onOpenChange={(open)=>{ if (!open) setSelected(null); }}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}

// ----------------------------- View Components -----------------------------
function ViewToggle({ view, setView }: { view: 'cards'|'table'|'browse'; setView:(v:'cards'|'table'|'browse')=>void }){
  return (
    <div className="flex items-center gap-1 rounded-2xl border p-1 shadow-sm bg-white">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={view==='browse' ? 'default' : 'ghost'} size="sm" onClick={()=> setView('browse')}>
            <LayoutGrid className="w-4 h-4 mr-1" /> Browse
          </Button>
        </TooltipTrigger>
        <TooltipContent>Browse by organizational structure</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={view==='cards' ? 'default' : 'ghost'} size="sm" onClick={()=> setView('cards')}>
            <LayoutGrid className="w-4 h-4 mr-1" /> Cards
          </Button>
        </TooltipTrigger>
        <TooltipContent>Card view with detailed information</TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={view==='table' ? 'default' : 'ghost'} size="sm" onClick={()=> setView('table')}>
            <Rows3 className="w-4 h-4 mr-1" /> Table
          </Button>
        </TooltipTrigger>
        <TooltipContent>Compact table view</TooltipContent>
      </Tooltip>
    </div>
  );
}

function FilterSelect({ label, value, setValue, options }:{ label:string; value:string; setValue:(v:string)=>void; options:string[] }){
  const opts = useMemo(()=> ['All', ...options.filter(Boolean)], [options]);
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="relative">
        <select className="w-full rounded-lg border px-3 py-2 bg-white appearance-none pr-8" value={value} onChange={(e)=> setValue(e.target.value)}>
          {opts.map(o=> <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// Enhanced cards with favorites
function CardsView({ records, selected, onToggle, favorites, onToggleFavorite }: { 
  records: DirectoryRecord[]; 
  selected: DirectoryRecord | null; 
  onToggle: (r: DirectoryRecord) => void;
  favorites: Set<string>;
  onToggleFavorite: (r: DirectoryRecord) => void;
}){
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {records.map((r, idx)=>(
        <Card key={idx} className="rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={()=> onToggle(r)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium leading-snug break-words">{r.Name || '(No name)'}</div>
                  {show(r.Title) && <div className="text-xs text-slate-500 font-normal mt-0.5 leading-snug break-words">{r.Title}</div>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-auto p-1"
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(r); }}
                >
                  <Star className={`w-4 h-4 ${favorites.has(personId(r) || '') ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                </Button>
              </div>
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
                {selected && sameRecord(selected, r) ? 'Close details' : 'Show details'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Enhanced table with favorites (using native HTML table)
function TableView({ records, onOpen, favorites, onToggleFavorite }: { 
  records: DirectoryRecord[]; 
  onOpen:(r:DirectoryRecord)=>void;
  favorites: Set<string>;
  onToggleFavorite: (r: DirectoryRecord) => void;
}): JSX.Element {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="w-12 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Team</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {records.map((r, i)=> (
            <tr key={i} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={()=> onOpen(r)}>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(r); }}
                >
                  <Star className={`w-4 h-4 ${favorites.has(personId(r) || '') ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                </Button>
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{r.Name}</td>
              <td className="px-4 py-3 text-slate-600">{r.Title}</td>
              <td className="px-4 py-3 text-slate-600">{r.Department}</td>
              <td className="px-4 py-3 text-slate-600">{r.Team}</td>
              <td className="px-4 py-3 text-[#19557f]">{r.Email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------- Browse View -----------------------------
function BrowseView({ data, selectedDiv, selectedDept, selectedTeam, onDiv, onDept, onTeam, onBack, onOpenCard, onRoot, onDivCrumb, onDeptCrumb, favorites, onToggleFavorite }:{
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
  favorites: Set<string>;
  onToggleFavorite: (r: DirectoryRecord) => void;
}){
  const divisions = useMemo(()=> uniqSorted(data.map(r=> r.Division).filter(show) as string[]), [data]);
  
  return (
    <div className="space-y-4">
      <div className="text-center text-slate-600">
        <p>Browse view coming soon! For now, try the Cards or Table view.</p>
      </div>
    </div>
  );
}

// ----------------------------- Details Sheet -----------------------------
function DetailsSheet({ record, onOpenChange, favorites, onToggleFavorite }:{ 
  record: DirectoryRecord | null; 
  onOpenChange: (open:boolean)=>void;
  favorites: Set<string>;
  onToggleFavorite: (r: DirectoryRecord) => void;
}){
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  if (!record) return null;
  const isDesktop = useIsDesktop();

  const HeaderBlock = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-lg font-semibold">{record?.Name || 'Details'}</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1"
            onClick={() => onToggleFavorite(record)}
          >
            <Star className={`w-5 h-5 ${favorites.has(personId(record) || '') ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
          </Button>
        </div>
        {(record._Regions?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">{record._Regions!.map((reg)=> <RegionPill key={reg} name={reg}/>)}</div>
        )}
      </div>
      <button 
        aria-label="Close details" 
        className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100" 
        onClick={() => onOpenChange(false)}
      >
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
          <div className="flex items-center gap-2 text-slate-700 mt-1">
            <MapPin className="w-4 h-4" /> 
            {record.Location} 
            {show(record.Timezone) ? <span className="text-slate-500">· {record.Timezone}</span> : null}
          </div>
        )}
        {([record.Days, record.Hours].some(show)) && (
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4" /> 
            {(show(record.Days) ? record.Days : '')} 
            {show(record.Hours) ? ` · ${record.Hours}` : null}
          </div>
        )}
      </div>

      <ContactSection record={record} onCopy={handleCopy} copiedField={copiedField} />

      <Separator />
      
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

function ContactSection({ record, onCopy, copiedField }:{ 
  record: DirectoryRecord;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}){
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
              <div className="flex items-center justify-between px-3 py-2">
                <a href={mailto(record.Email)!} className="flex items-center gap-2 text-[#19557f] hover:underline">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{record.Email}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => onCopy(record.Email!, 'email')}
                >
                  {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
            {record["Team Email"] && (
              <div className="flex items-center justify-between px-3 py-2">
                <a href={mailto(record["Team Email"])!} className="flex items-center gap-2 text-[#19557f] hover:underline">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{record["Team Email"]}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => onCopy(record["Team Email"]!, 'team-email')}
                >
                  {copiedField === 'team-email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {hasPhone && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Phone</div>
          <div className="rounded-lg border divide-y divide-slate-200">
            {record["Mobile #"] && (
              <div className="flex items-center justify-between px-3 py-2">
                <a href={telLink(record["Mobile #"])!} className="flex items-center gap-2 text-[#19557f] hover:underline">
                  <Phone className="w-4 h-4" />
                  <span className="truncate">{record["Mobile #"]}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => onCopy(record["Mobile #"]!, 'mobile')}
                >
                  {copiedField === 'mobile' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
            {record["Office #"] && (
              <div className="flex items-center justify-between px-3 py-2">
                <a href={telLink(record["Office #"])!} className="flex items-center gap-2 text-[#19557f] hover:underline">
                  <Phone className="w-4 h-4" />
                  <span className="truncate">{record["Office #"]}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => onCopy(record["Office #"]!, 'office')}
                >
                  {copiedField === 'office' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
            {record["Support Phone"] && (
              <div className="flex items-center justify-between px-3 py-2">
                <a href={telLink(record["Support Phone"])!} className="flex items-center gap-2 text-[#19557f] hover:underline">
                  <Phone className="w-4 h-4" />
                  <span className="truncate">{record["Support Phone"]}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1"
                  onClick={() => onCopy(record["Support Phone"]!, 'support')}
                >
                  {copiedField === 'support' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------- Export & Admin -----------------------------
function ExportMenu({ records }:{ records: DirectoryRecord[] }){
  const exportJSON = () => { 
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob); 
    triggerDownload(url, 'directory-export.json'); 
  };
  
  const exportCSV = () => { 
    const csv = Papa.unparse(records); 
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob); 
    triggerDownload(url, 'directory-export.csv'); 
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm'>
          <Download className='w-4 h-4 mr-2'/> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Export filtered results</DropdownMenuLabel>
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
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Settings className='w-4 h-4 mr-2'/> Admin
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Admin Tools</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            <p className="mb-2">Admin tools for managing directory data.</p>
            <p className="mb-2">Upload a CSV to update the directory. Parsed rows appear in the app immediately (client-side only).</p>
            <p>Admin mode is enabled with <code className="bg-slate-100 px-1 rounded">?admin=1</code> in the URL.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
            