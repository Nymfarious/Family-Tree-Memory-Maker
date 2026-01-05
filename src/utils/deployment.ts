/**
 * Runtime deployment utilities for handling asset paths across platforms
 */

import { getDeploymentConfig } from '@/config/deployment';

/**
 * Get the correct path for an asset based on deployment platform
 * Handles the GitHub Pages /repo-name/ prefix automatically
 */
export function getAssetPath(path: string): string {
  const { basePath } = getDeploymentConfig();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // For GitHub Pages, prepend the repo path
  if (basePath !== '/') {
    // Remove trailing slash from basePath and leading slash from path to avoid double slashes
    const cleanBase = basePath.replace(/\/$/, '');
    return `${cleanBase}${normalizedPath}`;
  }
  
  return normalizedPath;
}

/**
 * Get a full URL including origin for the given path
 */
export function getFullUrl(path: string): string {
  return `${window.location.origin}${getAssetPath(path)}`;
}

/**
 * Get the appropriate redirect URL for OAuth callbacks
 */
export function getOAuthRedirectUrl(callbackPath: string): string {
  const { platform, basePath } = getDeploymentConfig();
  const origin = window.location.origin;
  
  // Normalize the callback path
  const normalizedPath = callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`;
  
  // For GitHub Pages, include the repo path
  if (platform === 'github-pages') {
    return `${origin}${basePath.replace(/\/$/, '')}${normalizedPath}`;
  }
  
  return `${origin}${normalizedPath}`;
}

/**
 * Check if we're in a development environment
 */
export function isDevelopment(): boolean {
  return !getDeploymentConfig().isProduction;
}
