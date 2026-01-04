// src/components/GedcomParser.js
// Minimal pragmatic GEDCOM parser for: INDI, NAME, SEX, FAMC, FAMS
window.parseGedcom = function parseGedcom(text) {
  const lines = text.split(/\r?\n/);
  const people = {};   // id -> person
  const families = {}; // id -> family

  let current = null;
  let currentType = null;

  const trimVal = (s) => s?.trim() ?? "";

  for (const raw of lines) {
    if (!raw.trim()) continue;
    const m = raw.match(/^(\d+)\s+(@[^@]+@)?\s*([A-Z0-9_]+)?\s*(.*)?$/i);
    if (!m) continue;
    const level = Number(m[1]);
    const xref = m[2] || null;
    const tag  = (m[3] || "").toUpperCase();
    const rest = trimVal(m[4]);

    if (level === 0 && xref) {
      if (tag === "INDI") { 
        current = people[xref] = people[xref] || { id: xref }; 
        currentType = "INDI"; 
      }
      else if (tag === "FAM") { 
        current = families[xref] = families[xref] || { id: xref }; 
        currentType = "FAM"; 
      }
      else { 
        current = null; 
        currentType = null; 
      }
      continue;
    }

    if (!current) continue;

    if (currentType === "INDI") {
      if (tag === "NAME") {
        // GEDCOM NAME like: Given /Surname/
        // Extract display name and surname if present
        const sn = rest.match(/\/([^/]*)\//);
        current.name = rest.replace(/\//g, "").trim();
        current.surname = sn ? trimVal(sn[1]) : undefined;
      } else if (tag === "SEX") {
        current.sex = rest;
      } else if (tag === "FAMC") {
        current.famc = rest; // child in family
      } else if (tag === "FAMS") {
        current.fams = current.fams || [];
        current.fams.push(rest); // spouse in family
      }
    } else if (currentType === "FAM") {
      if (tag === "HUSB") current.husb = rest;
      else if (tag === "WIFE") current.wife = rest;
      else if (tag === "CHIL") {
        current.children = current.children || [];
        current.children.push(rest);
      }
    }
  }

  // Build quick indexes
  const childToParents = {};
  for (const fam of Object.values(families)) {
    for (const c of fam.children || []) {
      childToParents[c] = childToParents[c] || [];
      if (fam.husb) childToParents[c].push(fam.husb);
      if (fam.wife) childToParents[c].push(fam.wife);
    }
  }

  // Identify roots (people who are never children)
  const allChildren = new Set(Object.keys(childToParents));
  const roots = Object.keys(people).filter(pid => !allChildren.has(pid));

  return { people, families, childToParents, roots };
};