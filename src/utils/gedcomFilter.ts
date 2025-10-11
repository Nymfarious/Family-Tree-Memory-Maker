import type { GedcomData, Person, Family } from "@/types/gedcom";

/**
 * Filters GEDCOM data to only include people within N generations back from a given year
 */
export function filterGedcomByGenerations(
  data: GedcomData,
  maxGenerations: number,
  fromYear: number = 2026
): GedcomData {
  const includedPeople = new Set<string>();
  const includedFamilies = new Set<string>();
  
  // Find starting people (those born near or after fromYear)
  const startingPeople = Object.entries(data.people)
    .filter(([_, person]) => {
      if (!person.birth) return false;
      const birthYear = extractYear(person.birth);
      return birthYear && birthYear >= fromYear - 50; // Include people born within 50 years before fromYear
    })
    .map(([pid]) => pid);

  // Recursively add ancestors up to maxGenerations
  function addAncestors(pid: string, generation: number) {
    if (generation > maxGenerations || includedPeople.has(pid)) return;
    
    includedPeople.add(pid);
    
    // Find and add parent families
    const parentIds = data.childToParents[pid] || [];
    parentIds.forEach(parentId => {
      if (data.people[parentId]) {
        includedPeople.add(parentId);
        addAncestors(parentId, generation + 1);
      }
    });
    
    // Add families where this person is a child
    Object.entries(data.families).forEach(([fid, family]) => {
      if (family.children?.includes(pid)) {
        includedFamilies.add(fid);
        if (family.husb) addAncestors(family.husb, generation + 1);
        if (family.wife) addAncestors(family.wife, generation + 1);
      }
    });
    
    // Add families where this person is a spouse
    Object.entries(data.families).forEach(([fid, family]) => {
      if (family.husb === pid || family.wife === pid) {
        includedFamilies.add(fid);
      }
    });
  }

  // Process all starting people
  startingPeople.forEach(pid => addAncestors(pid, 0));

  // Build filtered data
  const filteredPeople: Record<string, Person> = {};
  const filteredFamilies: Record<string, Family> = {};
  const filteredChildToParents: Record<string, string[]> = {};
  
  includedPeople.forEach(pid => {
    if (data.people[pid]) {
      filteredPeople[pid] = data.people[pid];
    }
  });
  
  includedFamilies.forEach(fid => {
    if (data.families[fid]) {
      const family = data.families[fid];
      // Filter children to only included ones
      const filteredChildren = family.children?.filter(cid => includedPeople.has(cid)) || [];
      filteredFamilies[fid] = {
        ...family,
        children: filteredChildren
      };
    }
  });
  
  // Rebuild childToParents mapping
  Object.entries(data.childToParents).forEach(([child, parents]) => {
    if (includedPeople.has(child)) {
      const filteredParents = parents.filter(pid => includedPeople.has(pid));
      if (filteredParents.length > 0) {
        filteredChildToParents[child] = filteredParents;
      }
    }
  });
  
  // Find new roots (people with no parents in filtered set)
  const roots = Object.keys(filteredPeople).filter(
    pid => !filteredChildToParents[pid] || filteredChildToParents[pid].length === 0
  );

  return {
    people: filteredPeople,
    families: filteredFamilies,
    childToParents: filteredChildToParents,
    roots
  };
}

/**
 * Extract year from a GEDCOM date string
 */
function extractYear(dateStr: string): number | null {
  if (!dateStr) return null;
  
  // Try to find a 4-digit year
  const yearMatch = dateStr.match(/\b(1\d{3}|20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  
  return null;
}

/**
 * Export filtered GEDCOM data back to GEDCOM format string
 */
export function exportToGedcomString(data: GedcomData, treeName: string = "Filtered Tree"): string {
  let output: string[] = [];
  
  // Header
  output.push("0 HEAD");
  output.push("1 SOUR Lovable Family Tree");
  output.push(`2 NAME ${treeName}`);
  output.push("1 GEDC");
  output.push("2 VERS 5.5.1");
  output.push("2 FORM LINEAGE-LINKED");
  output.push("1 CHAR UTF-8");
  
  // Individuals
  Object.entries(data.people).forEach(([pid, person]) => {
    const xref = person.gedcomId || `@I${pid}@`;
    output.push(`0 ${xref} INDI`);
    
    if (person.name) {
      const fullName = person.surname 
        ? `${person.name} /${person.surname}/`
        : person.name;
      output.push(`1 NAME ${fullName}`);
      if (person.name) output.push(`2 GIVN ${person.name}`);
      if (person.surname) output.push(`2 SURN ${person.surname}`);
    }
    
    if (person.sex) output.push(`1 SEX ${person.sex}`);
    
    if (person.birth) {
      output.push("1 BIRT");
      output.push(`2 DATE ${person.birth}`);
      if (person.birthPlace) output.push(`2 PLAC ${person.birthPlace}`);
    }
    
    if (person.death) {
      output.push("1 DEAT");
      output.push(`2 DATE ${person.death}`);
      if (person.deathPlace) output.push(`2 PLAC ${person.deathPlace}`);
    }
    
    if (person.occupation) output.push(`1 OCCU ${person.occupation}`);
  });
  
  // Families
  Object.entries(data.families).forEach(([fid, family]) => {
    const xref = family.gedcomId || `@F${fid}@`;
    output.push(`0 ${xref} FAM`);
    
    if (family.husb) {
      const husbXref = data.people[family.husb]?.gedcomId || `@I${family.husb}@`;
      output.push(`1 HUSB ${husbXref}`);
    }
    
    if (family.wife) {
      const wifeXref = data.people[family.wife]?.gedcomId || `@I${family.wife}@`;
      output.push(`1 WIFE ${wifeXref}`);
    }
    
    family.children?.forEach(childId => {
      const childXref = data.people[childId]?.gedcomId || `@I${childId}@`;
      output.push(`1 CHIL ${childXref}`);
    });
  });
  
  // Trailer
  output.push("0 TRLR");
  
  return output.join("\n");
}