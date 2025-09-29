import type { GedcomData, Person, Family } from '@/types/gedcom';

export function parseGedcom(text: string): GedcomData {
  const lines = text.split(/\r?\n/);
  const people: Record<string, Person> = {};
  const families: Record<string, Family> = {};

  let current: Person | Family | null = null;
  let currentType: 'INDI' | 'FAM' | null = null;

  const trimVal = (s?: string) => s?.trim() ?? "";

  for (const raw of lines) {
    if (!raw.trim()) continue;
    
    const match = raw.match(/^(\d+)\s+(@[^@]+@)?\s*([A-Z0-9_]+)?\s*(.*)?$/i);
    if (!match) continue;
    
    const level = Number(match[1]);
    const xref = match[2] || null;
    const tag = (match[3] || "").toUpperCase();
    const rest = trimVal(match[4]);

    if (level === 0 && xref) {
      if (tag === "INDI") {
        current = people[xref] = people[xref] || { id: xref };
        currentType = "INDI";
      } else if (tag === "FAM") {
        current = families[xref] = families[xref] || { id: xref };
        currentType = "FAM";
      } else {
        current = null;
        currentType = null;
      }
      continue;
    }

    if (!current) continue;

    if (currentType === "INDI") {
      const person = current as Person;
      if (tag === "NAME") {
        // GEDCOM NAME like: Given /Surname/
        const surnameMatch = rest.match(/\/([^/]*)\//);
        person.name = rest.replace(/\//g, "").trim();
        person.surname = surnameMatch ? trimVal(surnameMatch[1]) : undefined;
      } else if (tag === "SEX") {
        person.sex = rest;
      } else if (tag === "FAMC") {
        person.famc = rest; // child in family
      } else if (tag === "FAMS") {
        person.fams = person.fams || [];
        person.fams.push(rest); // spouse in family
      }
    } else if (currentType === "FAM") {
      const family = current as Family;
      if (tag === "HUSB") {
        family.husb = rest;
      } else if (tag === "WIFE") {
        family.wife = rest;
      } else if (tag === "CHIL") {
        family.children = family.children || [];
        family.children.push(rest);
      }
    }
  }

  // Build quick indexes
  const childToParents: Record<string, string[]> = {};
  for (const family of Object.values(families)) {
    for (const child of family.children || []) {
      childToParents[child] = childToParents[child] || [];
      if (family.husb) childToParents[child].push(family.husb);
      if (family.wife) childToParents[child].push(family.wife);
    }
  }

  // Identify roots (people who are never children)
  const allChildren = new Set(Object.keys(childToParents));
  const roots = Object.keys(people).filter(pid => !allChildren.has(pid));

  return { people, families, childToParents, roots };
}