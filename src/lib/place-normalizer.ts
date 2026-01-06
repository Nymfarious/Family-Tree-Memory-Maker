// ============================================================================
// FAMILY TREE MEMORY MAKER - PLACE NORMALIZER
// Parses place strings into hierarchical structure for migration tracking
// NEW FILE: src/lib/place-normalizer.ts
// ============================================================================

import type { PlaceHierarchy } from '@/types/gedcom';

// ============================================================================
// US STATE MAPPINGS
// ============================================================================

const STATE_ABBREVIATIONS: Record<string, string> = {
  // Full names to abbreviations
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  
  // Common historical variants
  'mass': 'MA', 'mass.': 'MA', 'massachusetts bay': 'MA', 'mass bay colony': 'MA',
  'penn': 'PA', 'penn.': 'PA', 'penna': 'PA', 'penna.': 'PA',
  'conn': 'CT', 'conn.': 'CT',
  'va': 'VA', 'va.': 'VA',
  'ny': 'NY', 'n.y.': 'NY', 'n.y': 'NY',
  'indian territory': 'OK',
  'dakota territory': 'SD', // or ND, needs context
};

// Abbreviation to full name
const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
};

// ============================================================================
// US REGIONS
// ============================================================================

const STATE_TO_REGION: Record<string, string> = {
  // New England
  'CT': 'New England', 'ME': 'New England', 'MA': 'New England',
  'NH': 'New England', 'RI': 'New England', 'VT': 'New England',
  
  // Mid-Atlantic
  'NJ': 'Mid-Atlantic', 'NY': 'Mid-Atlantic', 'PA': 'Mid-Atlantic',
  'DE': 'Mid-Atlantic', 'MD': 'Mid-Atlantic', 'DC': 'Mid-Atlantic',
  
  // Upper South
  'VA': 'Upper South', 'WV': 'Upper South', 'KY': 'Upper South',
  'NC': 'Upper South', 'TN': 'Upper South',
  
  // Deep South
  'SC': 'Deep South', 'GA': 'Deep South', 'FL': 'Deep South',
  'AL': 'Deep South', 'MS': 'Deep South', 'LA': 'Deep South',
  
  // Midwest
  'OH': 'Midwest', 'IN': 'Midwest', 'IL': 'Midwest', 'MI': 'Midwest',
  'WI': 'Midwest', 'MN': 'Midwest', 'IA': 'Midwest', 'MO': 'Midwest',
  'ND': 'Midwest', 'SD': 'Midwest', 'NE': 'Midwest', 'KS': 'Midwest',
  
  // Southwest
  'TX': 'Southwest', 'OK': 'Southwest', 'AR': 'Southwest',
  'AZ': 'Southwest', 'NM': 'Southwest',
  
  // Mountain West
  'CO': 'Mountain West', 'WY': 'Mountain West', 'MT': 'Mountain West',
  'ID': 'Mountain West', 'UT': 'Mountain West', 'NV': 'Mountain West',
  
  // Pacific
  'CA': 'Pacific', 'OR': 'Pacific', 'WA': 'Pacific',
  'AK': 'Pacific', 'HI': 'Pacific',
};

// ============================================================================
// COUNTRY MAPPINGS
// ============================================================================

const COUNTRY_VARIANTS: Record<string, string> = {
  'usa': 'United States',
  'u.s.a.': 'United States',
  'u.s.': 'United States',
  'us': 'United States',
  'united states of america': 'United States',
  'america': 'United States',
  
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'britain': 'United Kingdom',
  'england': 'England',
  'scotland': 'Scotland',
  'wales': 'Wales',
  'ireland': 'Ireland',
  'northern ireland': 'Northern Ireland',
  
  'germany': 'Germany',
  'deutschland': 'Germany',
  'prussia': 'Germany (Prussia)',
  'bavaria': 'Germany (Bavaria)',
  'saxony': 'Germany (Saxony)',
  'hesse': 'Germany (Hesse)',
  'palatinate': 'Germany (Palatinate)',
  
  'france': 'France',
  'french': 'France',
  
  'canada': 'Canada',
  'quebec': 'Canada (Quebec)',
  'ontario': 'Canada (Ontario)',
  
  'mexico': 'Mexico',
  'new spain': 'Mexico (New Spain)',
};

// ============================================================================
// MAIN NORMALIZER FUNCTION
// ============================================================================

/**
 * Parse a raw place string into a hierarchical structure
 * Handles formats like:
 * - "Boston, Massachusetts, USA"
 * - "Chester County, Pennsylvania"
 * - "Dublin, Ireland"
 * - "Palatinate, Germany"
 */
export function normalizePlace(rawPlace: string): PlaceHierarchy {
  if (!rawPlace || rawPlace.trim() === '') {
    return {};
  }
  
  const result: PlaceHierarchy = {};
  
  // Split on commas and clean up
  const parts = rawPlace
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return {};
  }
  
  // Process from right to left (most general to most specific)
  const reversedParts = [...parts].reverse();
  
  for (let i = 0; i < reversedParts.length; i++) {
    const part = reversedParts[i];
    const partLower = part.toLowerCase();
    
    // Check if it's a country
    if (i === 0) {
      const normalizedCountry = COUNTRY_VARIANTS[partLower];
      if (normalizedCountry) {
        result.country = normalizedCountry;
        continue;
      }
      
      // Check if it's a US state (last part might be state if no country specified)
      const stateAbbrev = STATE_ABBREVIATIONS[partLower] || (partLower.length === 2 ? partLower.toUpperCase() : null);
      if (stateAbbrev && STATE_NAMES[stateAbbrev]) {
        result.state = STATE_NAMES[stateAbbrev];
        result.country = 'United States';
        result.region = STATE_TO_REGION[stateAbbrev];
        continue;
      }
      
      // Might be a country name we don't have mapped
      result.country = part;
      continue;
    }
    
    // Check if it's a US state
    const stateAbbrev = STATE_ABBREVIATIONS[partLower] || (partLower.length === 2 ? partLower.toUpperCase() : null);
    if (stateAbbrev && STATE_NAMES[stateAbbrev]) {
      result.state = STATE_NAMES[stateAbbrev];
      result.country = result.country || 'United States';
      result.region = STATE_TO_REGION[stateAbbrev];
      continue;
    }
    
    // Check if it looks like a county
    if (partLower.includes('county') || partLower.includes('parish') || partLower.includes('borough')) {
      result.county = part;
      continue;
    }
    
    // Otherwise it's probably a city/town
    if (!result.city) {
      result.city = part;
    } else if (!result.site) {
      // If we already have a city, this might be a more specific site
      result.site = result.city;
      result.city = part;
    }
  }
  
  return result;
}

/**
 * Get a display string from a PlaceHierarchy
 */
export function formatPlace(place: PlaceHierarchy, level: 'full' | 'state' | 'region' = 'full'): string {
  if (level === 'region' && place.region) {
    return place.region;
  }
  
  if (level === 'state' && place.state) {
    return place.state;
  }
  
  const parts: string[] = [];
  if (place.city) parts.push(place.city);
  if (place.county) parts.push(place.county);
  if (place.state) parts.push(place.state);
  if (place.country && place.country !== 'United States') parts.push(place.country);
  
  return parts.join(', ');
}

/**
 * Get region for a place (for coloring/grouping)
 */
export function getRegion(place: PlaceHierarchy): string | undefined {
  if (place.region) return place.region;
  
  // Try to derive from state
  if (place.state) {
    // Find state abbreviation
    const abbrev = Object.entries(STATE_NAMES).find(([, name]) => name === place.state)?.[0];
    if (abbrev) {
      return STATE_TO_REGION[abbrev];
    }
  }
  
  // For non-US places, use country as region
  if (place.country && place.country !== 'United States') {
    return place.country;
  }
  
  return undefined;
}

/**
 * Check if two places are in the same location (at a given level)
 */
export function isSameLocation(
  place1: PlaceHierarchy,
  place2: PlaceHierarchy,
  level: 'country' | 'region' | 'state' | 'county' | 'city' = 'state'
): boolean {
  switch (level) {
    case 'city':
      return place1.city === place2.city && place1.state === place2.state;
    case 'county':
      return place1.county === place2.county && place1.state === place2.state;
    case 'state':
      return place1.state === place2.state;
    case 'region':
      return getRegion(place1) === getRegion(place2);
    case 'country':
      return place1.country === place2.country;
    default:
      return false;
  }
}

/**
 * Extract year from a date string
 */
export function extractYear(dateStr: string): number | null {
  if (!dateStr) return null;
  
  // Handle "ABT 1820", "BEF 1790", "AFT 1850", etc.
  const yearMatch = dateStr.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  
  return null;
}

/**
 * Calculate mother's age at birth
 */
export function calculateMotherAge(
  personBirthYear: number | null,
  motherBirthYear: number | null
): number | null {
  if (!personBirthYear || !motherBirthYear) return null;
  const age = personBirthYear - motherBirthYear;
  // Sanity check: mother should be between 12 and 60 at birth
  if (age >= 12 && age <= 60) {
    return age;
  }
  return null;
}
