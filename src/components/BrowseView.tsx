import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DirectoryRecord } from "@/types";
import { CardsView } from "./CardsView";
import { RegionPill } from "./RegionPill";
import { show, uniqSorted, personId, managerId, sortOrderNum, normalize, hierarchyClasses } from "@/utils";

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

export { BrowseView };
