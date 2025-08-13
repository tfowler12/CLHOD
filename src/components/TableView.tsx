import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DirectoryRecord } from "@/types";

export function TableView({
  records,
  onOpen,
}: {
  records: DirectoryRecord[];
  onOpen: (r: DirectoryRecord) => void;
}) {
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
          {records.map((r, i) => (
            <TableRow
              key={i}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onOpen(r)}
            >
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
