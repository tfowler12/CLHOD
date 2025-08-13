import React, { useMemo, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Download } from "lucide-react";
import { DirectoryRecord } from "@/types";
import { deriveRegions, trimAll, triggerDownload, personId, managerId } from "@/utils";

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

export { AdminTools };
