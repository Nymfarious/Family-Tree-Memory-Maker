import type { GedcomData, Person, Family } from '@/types/gedcom';

// Generate stable UUID from GEDCOM xref
function generateUUID(xref: string): string {
  // Create a deterministic UUID based on the xref
  // This ensures the same xref always gets the same UUID
  let hash = 0;
  for (let i = 0; i < xref.length; i++) {
    const char = xref.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Format as UUID v4 style
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(0, 3)}-${hex.slice(0, 4)}-${hex.slice(0, 12)}`;
}

export function parseGedcom(text: string): GedcomData {
  const lines = text.split(/\r?\n/);
  const people: Record<string, Person> = {};
  const families: Record<string, Family> = {};
  const xrefToUUID: Record<string, string> = {};

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
        const uuid = xrefToUUID[xref] || (xrefToUUID[xref] = generateUUID(xref));
        current = people[uuid] = people[uuid] || { id: uuid, gedcomId: xref };
        currentType = "INDI";
      } else if (tag === "FAM") {
        const uuid = xrefToUUID[xref] || (xrefToUUID[xref] = generateUUID(xref));
        current = families[uuid] = families[uuid] || { id: uuid, gedcomId: xref };
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
      } else if (tag === "BIRT") {
        // Birth event - look for DATE and PLAC in next lines
        person.birth = person.birth || "";
      } else if (tag === "DATE" && person.birth !== undefined) {
        person.birth = rest;
      } else if (tag === "PLAC" && person.birth !== undefined && !person.birthPlace) {
        person.birthPlace = rest;
      } else if (tag === "DEAT") {
        // Death event - look for DATE and PLAC in next lines
        person.death = person.death || "";
      } else if (tag === "DATE" && person.death !== undefined && !person.birth?.includes(rest)) {
        person.death = rest;
      } else if (tag === "PLAC" && person.death !== undefined && !person.deathPlace) {
        person.deathPlace = rest;
      } else if (tag === "OCCU") {
        person.occupation = rest;
      } else if (tag === "FAMC") {
        const famUUID = xrefToUUID[rest] || (xrefToUUID[rest] = generateUUID(rest));
        person.famc = famUUID;
      } else if (tag === "FAMS") {
        person.fams = person.fams || [];
        const famUUID = xrefToUUID[rest] || (xrefToUUID[rest] = generateUUID(rest));
        person.fams.push(famUUID);
      }
    } else if (currentType === "FAM") {
      const family = current as Family;
      if (tag === "HUSB") {
        const husbUUID = xrefToUUID[rest] || (xrefToUUID[rest] = generateUUID(rest));
        family.husb = husbUUID;
      } else if (tag === "WIFE") {
        const wifeUUID = xrefToUUID[rest] || (xrefToUUID[rest] = generateUUID(rest));
        family.wife = wifeUUID;
      } else if (tag === "CHIL") {
        family.children = family.children || [];
        const childUUID = xrefToUUID[rest] || (xrefToUUID[rest] = generateUUID(rest));
        family.children.push(childUUID);
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