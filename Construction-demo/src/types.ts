export interface Subcontractor {
  id: string;
  name: string;
  trade: string;
  rating: number;
  projects: number;
  responseSpeed: string;
}

export interface Assignment {
  carried: Subcontractor[];
  backups: Subcontractor[];
  review: Subcontractor[];
}

export interface WorkItem {
  id: string;
  division: string;
  section: string;
  status: string;
}
