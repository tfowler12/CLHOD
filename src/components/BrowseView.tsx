import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DirectoryRecord } from "@/types";
import { CardsView } from "./CardsView";
import { OrgChart } from "./OrgChart";
import { show, uniqSorted, personId, normalize } from "@/utils";

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
    peopleInDiv.forEach(r => {
      if (!show(r.Department)) {
        (personId(r) ? p : res).push(r);
      }
    });
    return [p, res];
  }, [peopleInDiv]);

  const [deptPeople, deptResources] = useMemo(() => {
    const p: DirectoryRecord[] = [];
    const res: DirectoryRecord[] = [];
    peopleInDept.forEach(r => {
      if (!show(r.Team)) {
        (personId(r) ? p : res).push(r);
      }
    });
    return [p, res];
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

          {divPeople.length > 0 && (
            <CardsView records={divPeople} selected={null} onToggle={onOpenCard} />
          )}

          {divResources.length > 0 && <ResourceCallouts items={divResources} />}

          {orgVisible && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700">Division Org Chart</div>
              <OrgChart rows={peopleInDiv} onOpenCard={onOpenCard} />
            </div>
          )}
        </div>
      )}

      {selectedDiv && selectedDept && !selectedTeam && (
        <div className="space-y-4">
          {deptPeople.length > 0 && (
            <CardsView records={deptPeople} selected={null} onToggle={onOpenCard} />
          )}
          {deptResources.length > 0 && <ResourceCallouts items={deptResources} />}
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
              <OrgChart rows={peopleInDept} onOpenCard={onOpenCard} />
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
              <OrgChart rows={teamPeople} onOpenCard={onOpenCard} />
            </>
          )}
        </div>
      )}
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
