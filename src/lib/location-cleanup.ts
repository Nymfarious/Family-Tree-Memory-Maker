// src/lib/location-cleanup.ts
// Family Tree Memory Maker v2.1
// Utilities for cleaning up and normalizing location data

import type { Person, PlaceHierarchy } from '@/types/gedcom';
import { normalizePlace, getRegion } from './place-normalizer';

// ============================================================================
// TYPES
// ============================================================================

export interface LocationSummary {
  raw: string;
  normalized: PlaceHierarchy;
  region?: string;
  count: number;
  people: string[]; // person IDs
  birthCount: number;
  deathCount: number;
  otherCount: number;
  yearRange?: [number, number];
  issues: LocationIssue[];
}

export interface LocationIssue {
  type: 'duplicate_parts' | 'too_generic' | 'possible_duplicate' | 'missing_county' | 'missing_state';
  severity: 'warning' | 'error' | 'info';
  message: string;
  suggestion?: string;
  relatedLocations?: string[];
}

export interface LocationCluster {
  canonical: string;
  variants: string[];
  totalCount: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// ============================================================================
// ANALYZE LOCATIONS
// ============================================================================

/**
 * Analyze all locations in the people data
 */
export function analyzeLocations(people: Person[]): Map<string, LocationSummary> {
  const locationMap = new Map<string, LocationSummary>();

  people.forEach(person => {
    // Process birth place
    if (person.birthPlace) {
      addToLocationMap(locationMap, person.birthPlace, person.id, 'birth', person);
    }
    
    // Process death place
    if (person.deathPlace) {
      addToLocationMap(locationMap, person.deathPlace, person.id, 'death', person);
    }
    
    // Process other place events
    person.placeEvents?.forEach(event => {
      if (event.placeRaw) {
        addToLocationMap(locationMap, event.placeRaw, person.id, 'other', person);
      }
    });
  });

  // Detect issues for each location
  const allLocations = Array.from(locationMap.keys());
  locationMap.forEach((summary, location) => {
    summary.issues = detectLocationIssues(location, summary, allLocations);
  });

  return locationMap;
}

function addToLocationMap(
  map: Map<string, LocationSummary>,
  location: string,
  personId: string,
  eventType: 'birth' | 'death' | 'other',
  person: Person
) {
  if (!map.has(location)) {
    const normalized = normalizePlace(location);
    map.set(location, {
      raw: location,
      normalized,
      region: getRegion(normalized),
      count: 0,
      people: [],
      birthCount: 0,
      deathCount: 0,
      otherCount: 0,
      issues: [],
    });
  }

  const summary = map.get(location)!;
  
  if (!summary.people.includes(personId)) {
    summary.people.push(personId);
    summary.count++;
  }

  if (eventType === 'birth') {
    summary.birthCount++;
    const year = person.birthYear || extractYearFromDate(person.birth);
    if (year) updateYearRange(summary, year);
  } else if (eventType === 'death') {
    summary.deathCount++;
    const year = person.deathYear || extractYearFromDate(person.death);
    if (year) updateYearRange(summary, year);
  } else {
    summary.otherCount++;
  }
}

function updateYearRange(summary: LocationSummary, year: number) {
  if (!summary.yearRange) {
    summary.yearRange = [year, year];
  } else {
    summary.yearRange = [
      Math.min(summary.yearRange[0], year),
      Math.max(summary.yearRange[1], year)
    ];
  }
}

function extractYearFromDate(date?: string): number | null {
  if (!date) return null;
  const match = date.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]) : null;
}

// ============================================================================
// DETECT ISSUES
// ============================================================================

function detectLocationIssues(
  location: string,
  summary: LocationSummary,
  allLocations: string[]
): LocationIssue[] {
  const issues: LocationIssue[] = [];
  const parts = location.split(',').map(p => p.trim());
  const partsLower = parts.map(p => p.toLowerCase());

  // Check for duplicate parts (e.g., "Ulster, Ulster, New York")
  const uniqueParts = new Set(partsLower);
  if (uniqueParts.size < partsLower.length) {
    const duplicates = partsLower.filter((p, i) => partsLower.indexOf(p) !== i);
    issues.push({
      type: 'duplicate_parts',
      severity: 'warning',
      message: `Duplicate "${duplicates[0]}" - county may be incorrectly used as town`,
      suggestion: `Remove duplicate or verify correct town name`,
    });
  }

  // Check for too generic
  if (parts.length === 1) {
    issues.push({
      type: 'too_generic',
      severity: 'info',
      message: 'Location is just a state/country - consider adding county and city',
      suggestion: 'Add more specific location details',
    });
  } else if (parts.length === 2 && partsLower[1] === 'united states') {
    issues.push({
      type: 'too_generic',
      severity: 'info',
      message: 'Location is just state level - consider adding county',
      suggestion: 'Add county for more precise records',
    });
  }

  // Check for missing county (3 parts but middle one might not be county)
  if (summary.normalized.state && !summary.normalized.county && parts.length >= 2) {
    issues.push({
      type: 'missing_county',
      severity: 'info',
      message: 'No county detected in location',
    });
  }

  // Check for possible duplicates/variants
  const possibleDuplicates = findSimilarLocations(location, allLocations);
  if (possibleDuplicates.length > 0) {
    issues.push({
      type: 'possible_duplicate',
      severity: 'warning',
      message: `${possibleDuplicates.length} similar location(s) found`,
      suggestion: 'Consider merging these locations',
      relatedLocations: possibleDuplicates,
    });
  }

  return issues;
}

// ============================================================================
// FIND SIMILAR LOCATIONS
// ============================================================================

function findSimilarLocations(location: string, allLocations: string[]): string[] {
  const similar: string[] = [];
  const locationLower = location.toLowerCase();
  const locationParts = locationLower.split(',').map(p => p.trim());
  const normalized = normalizePlace(location);

  for (const other of allLocations) {
    if (other === location) continue;
    
    const otherLower = other.toLowerCase();
    const otherParts = otherLower.split(',').map(p => p.trim());
    const otherNorm = normalizePlace(other);

    // Same county and state? Likely related
    if (normalized.county && otherNorm.county &&
        normalized.county === otherNorm.county &&
        normalized.state === otherNorm.state) {
      similar.push(other);
      continue;
    }

    // One is substring of other?
    if (locationLower.includes(otherLower) || otherLower.includes(locationLower)) {
      similar.push(other);
      continue;
    }

    // Significant word overlap?
    const words1 = locationParts.flatMap(p => p.split(/\s+/)).filter(w => w.length > 3);
    const words2 = otherParts.flatMap(p => p.split(/\s+/)).filter(w => w.length > 3);
    const overlap = words1.filter(w => words2.includes(w));
    
    if (overlap.length >= 2 && overlap.length >= Math.min(words1.length, words2.length) * 0.5) {
      similar.push(other);
    }
  }

  return similar;
}

// ============================================================================
// CLUSTER LOCATIONS
// ============================================================================

/**
 * Group similar locations into clusters for bulk cleanup
 */
export function clusterLocations(locationMap: Map<string, LocationSummary>): LocationCluster[] {
  const clusters: LocationCluster[] = [];
  const processed = new Set<string>();
  const locations = Array.from(locationMap.keys());

  for (const location of locations) {
    if (processed.has(location)) continue;

    const summary = locationMap.get(location)!;
    const similar = findSimilarLocations(location, locations.filter(l => !processed.has(l)));
    
    if (similar.length > 0) {
      // Find the most complete/specific location as canonical
      const allInCluster = [location, ...similar];
      const canonical = findBestCanonical(allInCluster, locationMap);
      const variants = allInCluster.filter(l => l !== canonical);
      
      // Calculate total count
      const totalCount = allInCluster.reduce((sum, loc) => 
        sum + (locationMap.get(loc)?.count || 0), 0
      );

      // Determine confidence
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      let reason = 'Similar location names';
      
      // Check if all in same county
      const counties = allInCluster.map(l => locationMap.get(l)?.normalized.county).filter(Boolean);
      const uniqueCounties = new Set(counties);
      if (uniqueCounties.size === 1) {
        confidence = 'high';
        reason = `All in ${counties[0]} County`;
      }
      
      // Check if very different word count
      const wordCounts = allInCluster.map(l => l.split(/[,\s]+/).length);
      if (Math.max(...wordCounts) - Math.min(...wordCounts) > 3) {
        confidence = 'low';
        reason = 'Significant variation in detail level';
      }

      clusters.push({
        canonical,
        variants,
        totalCount,
        confidence,
        reason,
      });

      allInCluster.forEach(l => processed.add(l));
    }
  }

  return clusters.sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Find the best canonical form among similar locations
 */
function findBestCanonical(locations: string[], locationMap: Map<string, LocationSummary>): string {
  // Score each location
  const scores = locations.map(loc => {
    let score = 0;
    const summary = locationMap.get(loc);
    const normalized = summary?.normalized;
    
    // More parts = more specific = better
    const parts = loc.split(',').length;
    score += parts * 10;
    
    // Has county = better
    if (normalized?.county) score += 20;
    
    // Has city = better
    if (normalized?.city) score += 15;
    
    // More people = more established = slightly better
    score += Math.min(summary?.count || 0, 10);
    
    // No duplicate parts = better
    const partsLower = loc.split(',').map(p => p.trim().toLowerCase());
    if (new Set(partsLower).size === partsLower.length) {
      score += 25;
    }
    
    return { loc, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0].loc;
}

// ============================================================================
// GENERATE CLEANUP REPORT
// ============================================================================

export interface CleanupReport {
  totalLocations: number;
  totalIssues: number;
  issuesByType: Record<string, number>;
  clusters: LocationCluster[];
  topIssues: Array<{
    location: string;
    issues: LocationIssue[];
    count: number;
  }>;
}

export function generateCleanupReport(locationMap: Map<string, LocationSummary>): CleanupReport {
  const issuesByType: Record<string, number> = {};
  const topIssues: CleanupReport['topIssues'] = [];
  let totalIssues = 0;

  locationMap.forEach((summary, location) => {
    if (summary.issues.length > 0) {
      topIssues.push({
        location,
        issues: summary.issues,
        count: summary.count,
      });
      
      summary.issues.forEach(issue => {
        issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
        totalIssues++;
      });
    }
  });

  // Sort by count (most people affected first)
  topIssues.sort((a, b) => b.count - a.count);

  return {
    totalLocations: locationMap.size,
    totalIssues,
    issuesByType,
    clusters: clusterLocations(locationMap),
    topIssues: topIssues.slice(0, 20), // Top 20 issues
  };
}
