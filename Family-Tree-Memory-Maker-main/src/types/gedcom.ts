export interface Person {
  id: string; // Stable UUID
  gedcomId?: string; // Original GEDCOM xref for reference
  name?: string;
  surname?: string;
  nickname?: string;
  maidenName?: string;
  sex?: string;
  birth?: string;
  birthPlace?: string;
  death?: string;
  deathPlace?: string;
  occupation?: string;
  famc?: string; // family as child (UUID)
  fams?: string[]; // families as spouse (UUIDs)
  // Media attachments
  audioFiles?: string[]; // URLs to audio recordings
  documents?: string[]; // URLs to attached documents (txt, doc, pdf)
  notes?: string; // Free-form notes/summary
}

export interface Family {
  id: string; // Stable UUID
  gedcomId?: string; // Original GEDCOM xref for reference
  husb?: string; // husband UUID
  wife?: string; // wife UUID
  children?: string[]; // children UUIDs
}

export interface GedcomData {
  people: Record<string, Person>;
  families: Record<string, Family>;
  childToParents: Record<string, string[]>;
  roots: string[];
}

export interface ChangeLogEntry {
  title: string;
  when: string;
  author: string;
  detail?: string;
}

export type CloudProvider = 'generic' | 'supabase' | 'drive' | 'dropbox';