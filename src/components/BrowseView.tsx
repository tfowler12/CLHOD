import React, {
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DirectoryRecord } from "@/types";
import { CardsView } from "./CardsView";
import { RegionPill } from "./RegionPill";
import {
  show,
  uniqSorted,
  personId,
  managerId,
  sortOrderNum,
  normalize,
  hierarchyClasses,
} from "@/utils";

// ----------------------------- Browse (Divisions → Depts → Teams) -----------------------------
export function BrowseView({
  data,
  selectedDiv,
  selectedDept,
  selectedTeam,
  onDiv,
  onDept,
  onTeam,
  onBack,
  onOpenCard,
  onRoot,
  onDivCrumb,
  onDeptCrumb,
}: {
  data: DirectoryRecord[];
  selectedDiv: string | null;
  selectedDept: string | null;
  selectedTeam: string | null;
  onDiv: (d: string) => void;
  onDept: (d: string) => void;
  onTeam: (t: string) => void;
  onBack: () => void;
  onOpenCard: (r: DirectoryRecord) => void;
  onRoot?: () => void;
  onDivCrumb?: () => void;
  onDeptCrumb?: () => void;
}) {
  const [orgVisible, setOrgVisible] = useState(true);

  const divisions = useMemo(() => uniqSorted(data.map(r => r.Division).filter(show) as string[]), [data]);
  const deptsInDiv = useMemo(
    () =>
      uniqSorted(
        data
          .filter(r => (selectedDiv ? normalize(r.Division) === normalize(selectedDiv) : true))
          .map(r => r.Department)
          .filter(show) as string[]
      ),
    [data, selectedDiv]
  );
  const teamsInDept = useMemo(
    () =>
      uniqSorted(
        data
          .filter(
            r =>
              (selectedDiv ? normalize(r.Division) === normalize(selectedDiv) : true) &&
              (selectedDept ? normalize(r.Department) === normalize(selectedDept) : true)
          )
          .map(r => r.Team)
          .filter(show) as string[]
      ),
    [data, selectedDiv, selectedDept]
  );

  const peopleInDiv = useMemo(
    () =>
      data.filter(r =>
        selectedDiv ? normalize(r.Division) === normalize(selectedDiv) : false
      ),
    [data, selectedDiv]
  );
  const peopleInDept = useMemo(
    () =>
      data.filter(r =>
        selectedDiv && selectedDept
          ? normalize(r.Division) === normalize(selectedDiv) &&
            normalize(r.Department) === normalize(selectedDept)
          : false
      ),
    [data, selectedDiv, selectedDept]
  );
  const [teamPeople, teamResources] = useMemo(() => {
    const arr = data.filter(r =>
      selectedDiv && selectedDept && selectedTeam
        ? normalize(r.Division) === normalize(selectedDiv) &&
          normalize(r.Department) === normalize(selectedDept) &&
          normalize(r.Team) === normalize(selectedTeam)
        : false
    );
    const people: DirectoryRecord[] = [];
    const resources: DirectoryRecord[] = [];
    arr.forEach(r => (personId(r) ? people : resources).push(r));
    if (selectedDiv && selectedDiv.toLowerCase() === "sales") {
      const svps = data.filter(
        r =>
          r.Division === selectedDiv &&
          /senior\s+vice\s+president/i.test(r.Title || "")
      );
      const ids = new Set(people.map(r => personId(r)));
      svps.forEach(s => {
        const id = personId(s);
        if (id && !ids.has(id)) people.push(s);
      });
    }
    return [people, resources];
  }, [data, selectedDiv, selectedDept, selectedTeam]);

  const [divPeople, divResources] = useMemo(() => {
    const p: DirectoryRecord[] = [];
    const res: DirectoryRecord[] = [];
    peopleInDiv.forEach(r => (personId(r) ? p : res).push(r));
    return [p, res];
  }, [peopleInDiv]);

  const deptResources = useMemo(() => {
    const res: DirectoryRecord[] = [];
    peopleInDept.forEach(r => { if (!personId(r)) res.push(r); });
    return res;
  }, [peopleInDept]);

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
          {deptsInDiv.length > 0 && (
            <>
              <div className="text-sm font-medium text-slate-700">Departments</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {deptsInDiv.map((d) => (
                  <Card
                    key={d}
                    className="rounded-2xl shadow-sm hover:shadow cursor-pointer"
                    onClick={() => onDept(d)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{d}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600">
                      <div>
                        {data.filter(
                          r => r.Division === selectedDiv && r.Department === d
                        ).length}{" "}
                        people
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {deptsInDiv.length === 0 && divPeople.length > 0 && (
            <CardsView records={divPeople} selected={null} onToggle={onOpenCard} />
          )}

          {deptsInDiv.length === 0 && divResources.length > 0 && (
            <ResourceCallouts items={divResources} />
          )}

          {orgVisible && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Division Org Chart</div>
              <OrgMarketingChart
                rows={peopleInDiv}
                divisionName={selectedDiv!}
                onOpenCard={onOpenCard}
              />
            </div>
          )}
        </div>
      )}

      {selectedDiv && selectedDept && !selectedTeam && (
        <div className="space-y-4">
          {deptResources.length > 0 && (
            <ResourceCallouts items={deptResources} />
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamsInDept.map((t) => (
              <Card
                key={t}
                className="rounded-2xl shadow-sm hover:shadow cursor-pointer"
                onClick={() => onTeam(t)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">
                  <div>
                    {data.filter(
                      r =>
                        r.Division === selectedDiv &&
                        r.Department === selectedDept &&
                        r.Team === t
                    ).length} people
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {orgVisible && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Department Org Chart</div>
              <OrgMarketingChart
                rows={peopleInDept}
                divisionName={selectedDiv!}
                onOpenCard={onOpenCard}
              />
            </div>
          )}
        </div>
      )}

      {selectedDiv && selectedDept && selectedTeam && (
        <div className="space-y-4">
          <CardsView records={teamPeople} selected={null} onToggle={onOpenCard} />
          {teamResources.length > 0 && <ResourceCallouts items={teamResources} />}
          {orgVisible && (
            <>
              <div className="text-sm font-medium text-slate-700">Team Org Chart</div>
              <OrgMarketingChart
                rows={teamPeople}
                divisionName={selectedDiv!}
                onOpenCard={onOpenCard}
              />
            </>
          )}
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
  const [openVP, setOpenVP] = useState<string|null>(null);

  const recomputeTopConnectors = () => {
    const container = contRef.current;
    const topNode = topRef.current;
    if (!container || !topNode) return;
    const containerRect = container.getBoundingClientRect();
    const topRect = topNode.getBoundingClientRect();
    const topCenterX = topRect.left + topRect.width / 2 - containerRect.left;
    const topBottomY = topRect.bottom - containerRect.top;
    const directCenters = Array.from(directRefs.current.values()).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - containerRect.left,
        yTop: r.top - containerRect.top,
      };
    });
    if (directCenters.length === 0) {
      setSharedSegments([]);
      return;
    }
    const minCenterX = Math.min(...directCenters.map((c) => c.x));
    const maxCenterX = Math.max(...directCenters.map((c) => c.x));
    const topMostY = Math.min(...directCenters.map((c) => c.yTop));
    const midY = Math.max(topBottomY + 24, topMostY - 24);
    const pad = directCenters.length === 1 ? 24 : 0;
    const minX = minCenterX - pad;
    const maxX = maxCenterX + pad;
    const segments: {x1:number;y1:number;x2:number;y2:number}[] = [];
    segments.push({ x1: topCenterX, y1: topBottomY, x2: topCenterX, y2: midY });
    segments.push({ x1: minX, y1: midY, x2: maxX, y2: midY });
    directCenters.forEach((cc) =>
      segments.push({ x1: cc.x, y1: midY, x2: cc.x, y2: cc.yTop })
    );
    setSharedSegments(segments);
    setSvgBox({ w: containerRect.width, h: containerRect.height });
    const c = contRef.current; const tp = topRef.current;
    if (!c || !tp) return;
    const crect = c.getBoundingClientRect();
    const trect = tp.getBoundingClientRect();
    const tCenterX = trect.left + trect.width/2 - crect.left;
    const tBottomY = trect.bottom - crect.top;

    const childCenters = Array.from(directRefs.current.values()).map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - crect.left, yTop: r.top - crect.top };
    });
    if (childCenters.length === 0) { setSharedSegments([]); return; }
    const minX0 = Math.min(...childCenters.map(c => c.x));
    const maxX0 = Math.max(...childCenters.map(c => c.x));
    const topMost = Math.min(...childCenters.map(c => c.yTop));
    const yMid = Math.max(tBottomY + 24, topMost - 24);
    const pad = childCenters.length === 1 ? 24 : 0;
    const minX = minX0 - pad;
    const maxX = maxX0 + pad;
    const segs: any[] = [];
    const segs: any[] = [];
    const minX = Math.min(...childCenters.map(c=>c.x));
    const maxX = Math.max(...childCenters.map(c=>c.x));
    const yMid = tBottomY + 32;
    const segs:any[] = [];
    segs.push({ x1: tCenterX, y1: tBottomY, x2: tCenterX, y2: yMid });
    segs.push({ x1: minX, y1: yMid, x2: maxX, y2: yMid });
    childCenters.forEach(cc => segs.push({ x1: cc.x, y1: yMid, x2: cc.x, y2: cc.yTop }));
    setSharedSegments(segs);
    setSvgBox({ w: crect.width, h: crect.height });
  };

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => recomputeTopConnectors());
    return () => cancelAnimationFrame(raf);
  }, [directs, openVP]);
  useEffect(()=>{
    const onResize = ()=> recomputeTopConnectors();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(()=> recomputeTopConnectors());
    if (contRef.current) ro.observe(contRef.current);
    return ()=> { window.removeEventListener('resize', onResize); ro.disconnect(); };
  }, []);

  const isFMD = (divisionName || "").toLowerCase().includes("field") && (divisionName || "").toLowerCase().includes("market");
  const isSales = (divisionName || "").toLowerCase().includes("sales");

  const { tier2, tier3 } = useMemo(() => {
    if (!isSales) return { tier2: directs, tier3: [] as DirectoryRecord[] };
    const vps = directs.filter(d => {
      const t = (d.Title || "").toLowerCase();
      return /(vice\s+president|\bvp\b)/.test(t) &&
        !/(assistant\s+vice\s+president|\bavp\b)/.test(t);
    });
    const others = directs.filter(d => !vps.includes(d));
    return { tier2: vps, tier3: others };
  }, [directs, isSales]);

  const renderDirect = (n: DirectoryRecord) => {
    const id = personId(n)!;
    const hasSub = (children.get(id) || []).length > 0;
    const opened = openVP === id;
    return (
      <div key={id} ref={setDirectRef(id)} className="inline-block text-center">
        <div className="w-64">
          <OrgMiniCard node={n} depth={1} onOpenCard={onOpenCard} />
        </div>
        {isFMD ? (
          hasSub && (
            <>
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpenVP(opened ? null : id);
                    requestAnimationFrame(recomputeTopConnectors);
                  }}
                >
                  {opened ? "Hide Org" : "Show Org"}
                </Button>
              </div>
              {opened && (
                <div className="mt-2 flex justify-center">
                  <VerticalStackSubtree
                    parentId={id}
                    childrenMap={children}
                    depth={2}
                    onOpenCard={onOpenCard}
                  />
                </div>
              )}
            </>
          )
        ) : (
          <VerticalStackSubtree
            parentId={id}
            childrenMap={children}
            depth={2}
            onOpenCard={onOpenCard}
          />
        )}
      </div>
    );
  };

  return (
    <div ref={contRef} className="relative w-full">
      <svg className="absolute inset-0 pointer-events-none" width={svgBox.w} height={svgBox.h} viewBox={`0 0 ${svgBox.w} ${svgBox.h}`} preserveAspectRatio="none">
        {sharedSegments.map((s, i)=> (
        <path key={i} d={`M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`} fill="none" stroke="#5B7183" strokeOpacity={0.6} strokeWidth={2} />
        ))}
      </svg>

      <div className="flex justify-center mb-6">
        <div ref={topRef} className="inline-block w-64">
          <OrgMiniCard node={top} depth={0} onOpenCard={onOpenCard} />
        </div>
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-start justify-center gap-6 mb-8" >
          {tier2.map(n => renderDirect(n))}
        </div>
        {isSales && tier3.length > 0 && (
          <div className="flex flex-wrap items-start justify-center gap-6 mb-8">
            {tier3.map(n => renderDirect(n))}
          </div>
        )}
      </div>
    </div>
  );
}
function VerticalStackSubtree({ parentId, childrenMap, depth, onOpenCard }:{ parentId:string; childrenMap: Map<string, DirectoryRecord[]>; depth: number; onOpenCard:(r:DirectoryRecord)=>void }){
  const kids = (childrenMap.get(parentId) || []).slice();
  if (kids.length === 0) return null;

  const isManagerLevel = kids.every(k => {
    const t = (k.Title || "").toLowerCase();
    return /manager|director|vice\s+president|vp|chief|president|avp|assistant\s+vice\s+president/.test(t);
  });

  if (isManagerLevel) {
    return (
      <div className="mt-6 flex flex-wrap items-start justify-center gap-6">
        {kids.map(k => {
          const id = personId(k)!;
          const hasSub = (childrenMap.get(id) || []).length > 0;
          return (
            <div key={id} className="text-center">
              <OrgMiniCard node={k} depth={depth} onOpenCard={onOpenCard} />
              {hasSub && (
                <div className="mt-2">
                  <VerticalStackSubtree parentId={id} childrenMap={childrenMap} depth={depth+1} onOpenCard={onOpenCard} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative mt-6 ml-10">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-[#5B7183]/60" />
      <div className="space-y-3">
        {kids.map((k)=>{
          const id = personId(k)!;
          const hasSub = (childrenMap.get(id) || []).length > 0;
          return (
            <div key={id} className="relative pl-4">
              <div className="absolute left-0 top-5 w-4 h-px bg-[#5B7183]/60" />
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

function ResourceCallouts({ items }:{ items: DirectoryRecord[] }){
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map(r => (
        <Card key={r.Name || r.Resource} className="rounded-2xl border border-[#19557f] bg-[#D3ECF7]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{r.Name || r.Resource}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-1">
            {r["Team Email"] && <div>{r["Team Email"]}</div>}
            {r["Support Phone"] && <div>{r["Support Phone"]}</div>}
            {r.Description && <div>{r.Description}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
