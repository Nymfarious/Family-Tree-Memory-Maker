export interface Person {
  id: string;
  name?: string;
  surname?: string;
  sex?: string;
  famc?: string; // family as child
  fams?: string[]; // families as spouse
}

export interface Family {
  id: string;
  husb?: string; // husband ID
  wife?: string; // wife ID
  children?: string[];
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