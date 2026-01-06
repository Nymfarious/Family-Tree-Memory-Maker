// ============================================================================
// FAMILY TREE MEMORY MAKER - ORGANIZATIONS REFERENCE DATA
// Lineage societies, fraternal orders, and qualification tracking
// NEW FILE: src/types/organizations.ts
// ============================================================================

import type { LineageSociety, OrganizationCategory } from './gedcom';

// ============================================================================
// LINEAGE SOCIETIES DATABASE
// ============================================================================

export const LINEAGE_SOCIETIES: LineageSociety[] = [
  // === REVOLUTIONARY WAR ===
  {
    id: 'dar',
    name: 'Daughters of the American Revolution',
    abbreviation: 'DAR',
    category: 'lineage_revolutionary',
    foundedYear: 1890,
    website: 'https://www.dar.org',
    requirements: {
      description: 'Women descended from a patriot of the American Revolution',
      qualifyingEvents: ['Military service', 'Civil service', 'Material aid', 'Signing oaths of allegiance'],
      qualifyingDateRange: { start: '1775-04-19', end: '1783-11-26' },
      lineageType: 'direct',
      genderRestriction: 'female'
    },
    icon: '🇺🇸',
    color: '#002868'
  },
  {
    id: 'sar',
    name: 'Sons of the American Revolution',
    abbreviation: 'SAR',
    category: 'lineage_revolutionary',
    foundedYear: 1889,
    website: 'https://www.sar.org',
    requirements: {
      description: 'Men descended from a patriot of the American Revolution',
      qualifyingEvents: ['Military service', 'Civil service', 'Material aid'],
      qualifyingDateRange: { start: '1775-04-19', end: '1783-11-26' },
      lineageType: 'direct',
      genderRestriction: 'male'
    },
    icon: '🦅',
    color: '#002868'
  },
  {
    id: 'car',
    name: 'Children of the American Revolution',
    abbreviation: 'C.A.R.',
    category: 'lineage_revolutionary',
    foundedYear: 1895,
    requirements: {
      description: 'Children (under 22) descended from Revolutionary War patriots',
      qualifyingEvents: ['Same as DAR/SAR'],
      qualifyingDateRange: { start: '1775-04-19', end: '1783-11-26' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '⭐',
    color: '#002868'
  },

  // === COLONIAL ===
  {
    id: 'mayflower',
    name: 'General Society of Mayflower Descendants',
    abbreviation: 'GSMD',
    category: 'lineage_colonial',
    foundedYear: 1897,
    website: 'https://www.themayflowersociety.org',
    requirements: {
      description: 'Descended from a passenger on the Mayflower (1620)',
      qualifyingEvents: ['Mayflower passenger who survived first winter'],
      qualifyingDateRange: { start: '1620-09-16', end: '1621-11-11' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '⛵',
    color: '#8B4513'
  },
  {
    id: 'colonial_dames',
    name: 'National Society of Colonial Dames of America',
    abbreviation: 'NSCDA',
    category: 'lineage_colonial',
    foundedYear: 1891,
    requirements: {
      description: 'Women descended from colonial officials before 1776',
      qualifyingEvents: ['Colonial official', 'Military officer', 'Clergy'],
      qualifyingDateRange: { start: '1607-01-01', end: '1776-07-04' },
      lineageType: 'direct',
      genderRestriction: 'female'
    },
    icon: '👑',
    color: '#4B0082'
  },
  {
    id: 'jamestowne',
    name: 'Jamestowne Society',
    abbreviation: 'JS',
    category: 'lineage_colonial',
    foundedYear: 1936,
    requirements: {
      description: 'Descended from Jamestown colonist before 1700',
      qualifyingEvents: ['Virginia Company stockholder', 'Jamestown colonist', 'Burgess'],
      qualifyingDateRange: { start: '1607-05-14', end: '1699-12-31' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🏛️',
    color: '#228B22'
  },

  // === FIRST FAMILIES ===
  {
    id: 'ffv',
    name: 'First Families of Virginia',
    abbreviation: 'FFV',
    category: 'first_families',
    requirements: {
      description: 'Descended from Virginia colonists before 1700',
      qualifyingEvents: ['Arrived in Virginia Colony before 1700'],
      qualifyingDateRange: { start: '1607-05-14', end: '1699-12-31' },
      qualifyingLocations: ['Virginia Colony'],
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🌿',
    color: '#006400'
  },
  {
    id: 'ffo',
    name: 'First Families of Ohio',
    abbreviation: 'FFO',
    category: 'first_families',
    foundedYear: 1989,
    requirements: {
      description: 'Descended from Ohio Territory settlers before 1803',
      qualifyingEvents: ['Resided in Ohio Territory before March 1, 1803'],
      qualifyingDateRange: { start: '1788-01-01', end: '1803-03-01' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🌰',
    color: '#E31837'
  },
  {
    id: 'fft',
    name: 'First Families of Tennessee',
    abbreviation: 'FFT',
    category: 'first_families',
    requirements: {
      description: 'Descended from Tennessee settlers before 1796',
      qualifyingEvents: ['Resided in Tennessee before June 1, 1796'],
      qualifyingDateRange: { start: '1769-01-01', end: '1796-06-01' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🎸',
    color: '#FF6B00'
  },
  {
    id: 'california_pioneers',
    name: 'Society of California Pioneers',
    abbreviation: 'SCP',
    category: 'first_families',
    foundedYear: 1850,
    requirements: {
      description: 'Descended from California residents before 1850',
      qualifyingEvents: ['Resided in California before January 1, 1850'],
      qualifyingDateRange: { start: '1769-01-01', end: '1850-01-01' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🐻',
    color: '#FFB81C'
  },

  // === TEXAS ===
  {
    id: 'drt',
    name: 'Daughters of the Republic of Texas',
    abbreviation: 'DRT',
    category: 'lineage_texas',
    foundedYear: 1891,
    website: 'https://www.drtinfo.org',
    requirements: {
      description: 'Women descended from Texas Republic residents (before Feb 19, 1846)',
      qualifyingEvents: ['Resided in Texas before annexation', 'Service to Republic', 'Alamo/Goliad defender'],
      qualifyingDateRange: { start: '1835-01-01', end: '1846-02-19' },
      qualifyingLocations: ['Republic of Texas'],
      lineageType: 'direct',
      genderRestriction: 'female'
    },
    icon: '🤠',
    color: '#BF0A30'
  },
  {
    id: 'srt',
    name: 'Sons of the Republic of Texas',
    abbreviation: 'SRT',
    category: 'lineage_texas',
    foundedYear: 1893,
    requirements: {
      description: 'Men descended from Texas Republic residents',
      qualifyingEvents: ['Resided in Texas before Feb 19, 1846'],
      qualifyingDateRange: { start: '1836-03-02', end: '1846-02-19' },
      lineageType: 'direct',
      genderRestriction: 'male'
    },
    icon: '⭐',
    color: '#002868'
  },
  {
    id: 'texas_1836',
    name: 'Texas Resident Pre-1836',
    abbreviation: 'TX1836',
    category: 'lineage_texas',
    requirements: {
      description: 'Ancestor lived in Texas before independence from Mexico',
      qualifyingEvents: ['Resided in Mexican Texas'],
      qualifyingDateRange: { start: '1821-08-24', end: '1836-03-02' },
      qualifyingLocations: ['Coahuila y Texas', 'Mexican Texas'],
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🌵',
    color: '#CC5500'
  },
  {
    id: 'alamo_defenders',
    name: 'Alamo Defenders Descendants',
    abbreviation: 'ADD',
    category: 'lineage_texas',
    requirements: {
      description: 'Descended from those who died at the Alamo',
      qualifyingEvents: ['Died at the Battle of the Alamo'],
      qualifyingDateRange: { start: '1836-02-23', end: '1836-03-06' },
      lineageType: 'either',
      genderRestriction: 'none'
    },
    icon: '🏰',
    color: '#8B0000'
  },

  // === CIVIL WAR ===
  {
    id: 'scv',
    name: 'Sons of Confederate Veterans',
    abbreviation: 'SCV',
    category: 'lineage_civil_war',
    foundedYear: 1896,
    requirements: {
      description: 'Male descendants of Confederate soldiers',
      qualifyingEvents: ['Confederate military service'],
      qualifyingDateRange: { start: '1861-04-12', end: '1865-05-09' },
      lineageType: 'direct',
      genderRestriction: 'male'
    },
    icon: '⚔️',
    color: '#808080'
  },
  {
    id: 'udc',
    name: 'United Daughters of the Confederacy',
    abbreviation: 'UDC',
    category: 'lineage_civil_war',
    foundedYear: 1894,
    requirements: {
      description: 'Female descendants of Confederate soldiers',
      qualifyingEvents: ['Confederate military or civil service'],
      qualifyingDateRange: { start: '1861-04-12', end: '1865-05-09' },
      lineageType: 'either',
      genderRestriction: 'female'
    },
    icon: '🎀',
    color: '#808080'
  },
  {
    id: 'suvcw',
    name: 'Sons of Union Veterans of the Civil War',
    abbreviation: 'SUVCW',
    category: 'lineage_civil_war',
    foundedYear: 1881,
    requirements: {
      description: 'Male descendants of Union soldiers',
      qualifyingEvents: ['Union military service'],
      qualifyingDateRange: { start: '1861-04-12', end: '1865-05-09' },
      lineageType: 'either',
      genderRestriction: 'male'
    },
    icon: '🦅',
    color: '#002868'
  },
  {
    id: 'duvcw',
    name: 'Daughters of Union Veterans of the Civil War',
    abbreviation: 'DUVCW',
    category: 'lineage_civil_war',
    foundedYear: 1885,
    requirements: {
      description: 'Female descendants of Union soldiers',
      qualifyingEvents: ['Union military service'],
      qualifyingDateRange: { start: '1861-04-12', end: '1865-04-09' },
      lineageType: 'either',
      genderRestriction: 'female'
    },
    icon: '🌹',
    color: '#002868'
  },

  // === WAR OF 1812 ===
  {
    id: 'usd1812',
    name: 'United States Daughters of 1812',
    abbreviation: 'USD 1812',
    category: 'lineage_war_1812',
    foundedYear: 1892,
    requirements: {
      description: 'Women descended from War of 1812 patriots',
      qualifyingEvents: ['Military service', 'Naval service', 'Civil service'],
      qualifyingDateRange: { start: '1812-06-18', end: '1815-02-17' },
      lineageType: 'direct',
      genderRestriction: 'female'
    },
    icon: '🎖️',
    color: '#000080'
  },

  // === IMMIGRATION/HERITAGE ===
  {
    id: 'huguenot',
    name: 'Huguenot Society of America',
    abbreviation: 'HSA',
    category: 'lineage_immigration',
    foundedYear: 1883,
    requirements: {
      description: 'Descended from French Protestant (Huguenot) emigrants',
      qualifyingEvents: ['Huguenot who emigrated due to religious persecution'],
      qualifyingDateRange: { start: '1598-04-13', end: '1787-11-07' },
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '⚜️',
    color: '#FFD700'
  },
  {
    id: 'holland_society',
    name: 'Holland Society of New York',
    abbreviation: 'HSNY',
    category: 'lineage_immigration',
    foundedYear: 1885,
    requirements: {
      description: 'Male descendants of Dutch settlers in New Netherland before 1675',
      qualifyingEvents: ['Dutch settler in New Netherland'],
      qualifyingDateRange: { start: '1609-01-01', end: '1675-12-31' },
      qualifyingLocations: ['New Netherland', 'New Amsterdam'],
      lineageType: 'direct',
      genderRestriction: 'male'
    },
    icon: '🌷',
    color: '#FF6B00'
  },
  {
    id: 'palatines',
    name: 'Palatines to America',
    abbreviation: 'PAL-AM',
    category: 'lineage_immigration',
    foundedYear: 1975,
    requirements: {
      description: 'Descended from German Palatinate immigrants',
      qualifyingEvents: ['Immigration from German Palatinate region'],
      qualifyingLocations: ['Palatinate (Germany)', 'Rhineland'],
      lineageType: 'direct',
      genderRestriction: 'none'
    },
    icon: '🏔️',
    color: '#FFCC00'
  },
];

// ============================================================================
// FRATERNAL ORGANIZATIONS
// ============================================================================

export const FRATERNAL_ORGANIZATIONS: Partial<LineageSociety>[] = [
  { id: 'masons', name: 'Freemasons', abbreviation: 'AF&AM', category: 'fraternal', icon: '🔺', color: '#1E3A5F' },
  { id: 'scottish_rite', name: 'Scottish Rite', abbreviation: 'SR', category: 'fraternal', icon: '🦅', color: '#1E3A5F' },
  { id: 'shriners', name: 'Shriners International', abbreviation: 'Shriners', category: 'fraternal', icon: '🧕', color: '#CC0000' },
  { id: 'eastern_star', name: 'Order of the Eastern Star', abbreviation: 'OES', category: 'fraternal', icon: '⭐', color: '#800080' },
  { id: 'elks', name: 'Benevolent Order of Elks', abbreviation: 'BPOE', category: 'fraternal', icon: '🦌', color: '#4B0082' },
  { id: 'odd_fellows', name: 'Independent Order of Odd Fellows', abbreviation: 'IOOF', category: 'fraternal', icon: '🔗', color: '#8B0000' },
  { id: 'knights_columbus', name: 'Knights of Columbus', abbreviation: 'K of C', category: 'fraternal', icon: '⚔️', color: '#002868' },
  { id: 'knights_pythias', name: 'Knights of Pythias', abbreviation: 'KP', category: 'fraternal', icon: '🛡️', color: '#FFD700' },
  { id: 'woodmen', name: 'Woodmen of the World', abbreviation: 'WOW', category: 'fraternal', icon: '🌲', color: '#228B22' },
  { id: 'moose', name: 'Loyal Order of Moose', abbreviation: 'LOOM', category: 'fraternal', icon: '🫎', color: '#8B4513' },
  { id: 'eagles', name: 'Fraternal Order of Eagles', abbreviation: 'FOE', category: 'fraternal', icon: '🦅', color: '#002147' },
  { id: 'lions', name: 'Lions Clubs International', abbreviation: 'Lions', category: 'civic', icon: '🦁', color: '#002D62' },
  { id: 'rotary', name: 'Rotary International', abbreviation: 'Rotary', category: 'civic', icon: '⚙️', color: '#F7A81B' },
  { id: 'vfw', name: 'Veterans of Foreign Wars', abbreviation: 'VFW', category: 'hereditary_military', icon: '🎗️', color: '#7B1113' },
  { id: 'american_legion', name: 'American Legion', abbreviation: 'AL', category: 'hereditary_military', icon: '🌟', color: '#002868' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAllOrganizations(): Array<LineageSociety | Partial<LineageSociety>> {
  return [...LINEAGE_SOCIETIES, ...FRATERNAL_ORGANIZATIONS];
}

export function getOrganizationById(id: string): LineageSociety | Partial<LineageSociety> | undefined {
  return getAllOrganizations().find(org => org.id === id);
}

export function getOrganizationsByCategory(category: OrganizationCategory): Array<LineageSociety | Partial<LineageSociety>> {
  return getAllOrganizations().filter(org => org.category === category);
}

export function getLineageSocietiesOnly(): LineageSociety[] {
  return LINEAGE_SOCIETIES;
}

export function getFraternalOrgsOnly(): Partial<LineageSociety>[] {
  return FRATERNAL_ORGANIZATIONS;
}

// Organization category labels for UI
export const CATEGORY_LABELS: Record<OrganizationCategory, string> = {
  lineage_revolutionary: 'Revolutionary War',
  lineage_colonial: 'Colonial',
  lineage_texas: 'Texas',
  lineage_civil_war: 'Civil War',
  lineage_war_1812: 'War of 1812',
  lineage_immigration: 'Immigration/Heritage',
  first_families: 'First Families',
  hereditary_military: 'Military Heritage',
  fraternal: 'Fraternal Orders',
  religious: 'Religious',
  military_unit: 'Military Units',
  civic: 'Civic Organizations',
  other: 'Other',
};
