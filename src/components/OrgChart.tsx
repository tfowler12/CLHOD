import React, { useMemo } from "react";
import { DirectoryRecord } from "@/types";
import { personId, managerId, hierarchyClasses } from "@/utils";
import { RegionPill } from "./RegionPill";

export function OrgChart({ rows, onOpenCard }:{ rows: DirectoryRecord[]; onOpenCard:(r:DirectoryRecord)=>void }){
  const byId = useMemo(() => {
    const map = new Map<string, DirectoryRecord>();
    rows.forEach(r => {
      const id = personId(r);
      if (id) map.set(id, r);
    });
    return map;
  }, [rows]);

  const children = useMemo(() => {
    const map = new Map<string, DirectoryRecord[]>();
    rows.forEach(r => {
      const id = personId(r);
      if (!id) return;
      const mgr = managerId(r);
      const key = mgr && byId.has(mgr) ? mgr : "__ROOT__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [rows, byId]);

  const roots = children.get("__ROOT__") || [];
  if (roots.length === 0) return <div className="text-sm text-slate-600">No hierarchy data found.</div>;

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
      {roots.map(r => (
        <div key={personId(r)!} className="mb-6 break-inside-avoid">
          <OrgNode node={r} childrenMap={children} depth={0} onOpenCard={onOpenCard} />
        </div>
      ))}
    </div>
  );
}

function OrgNode({ node, childrenMap, depth, onOpenCard }:{ node: DirectoryRecord; childrenMap: Map<string, DirectoryRecord[]>; depth: number; onOpenCard:(r:DirectoryRecord)=>void }){
  const id = personId(node)!;
  const kids = childrenMap.get(id) || [];
  return (
    <div>
      <OrgCard node={node} depth={depth} onOpenCard={onOpenCard} />
      {kids.length > 0 && (
        <div className="ml-8 mt-3 border-l border-[#C3CFDA] pl-4 space-y-3">
          {kids.map(k => (
            <OrgNode key={personId(k)!} node={k} childrenMap={childrenMap} depth={depth+1} onOpenCard={onOpenCard} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgCard({ node, depth, onOpenCard }:{ node: DirectoryRecord; depth: number; onOpenCard:(r:DirectoryRecord)=>void }){
  return (
    <div className={`rounded-xl border px-3 py-2 cursor-pointer hover:shadow w-64 ${hierarchyClasses(depth)}`} onClick={() => onOpenCard(node)}>
      <div className="font-medium leading-snug break-words text-center">{node.Name}</div>
      {node.Title && <div className="text-xs leading-snug break-words text-center opacity-90">{node.Title}</div>}
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {(node._Regions || []).map(reg => <RegionPill key={reg} name={reg} />)}
      </div>
    </div>
  );
}
