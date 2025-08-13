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
