import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Clock, ExternalLink, X } from "lucide-react";
import { DirectoryRecord } from "@/types";
import { RegionPill } from "./RegionPill";
import { show, mailto, telLink, useIsDesktop } from "@/utils";

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

export { DetailsSheet };
