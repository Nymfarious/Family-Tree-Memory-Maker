/**
 * Deployment configuration adapter
 * Auto-detects deployment platform and provides appropriate settings
 */

export type DeploymentPlatform = 'lovable' | 'github-pages' | 'custom-domain' | 'local';

export interface DeploymentConfig {
  platform: DeploymentPlatform;
  basePath: string;
  isProduction: boolean;
}

/**
 * Detects the current deployment platform based on hostname
 */
export function getDeploymentConfig(): DeploymentConfig {
  const hostname = window.location.hostname;
  const isProduction = import.meta.env.PROD;

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return {
      platform: 'local',
      basePath: '/',
      isProduction: false,
    };
  }

  // Lovable preview/production
  if (hostname.includes('lovable.app') || hostname.includes('lovableproject.com')) {
    return {
      platform: 'lovable',
      basePath: '/',
      isProduction,
    };
  }

  // GitHub Pages (username.github.io/repo-name)
  if (hostname.includes('github.io')) {
    return {
      platform: 'github-pages',
      basePath: '/Family-Tree-Memory-Maker/',
      isProduction: true,
    };
  }

  // Custom domain - no path prefix needed
  return {
    platform: 'custom-domain',
    basePath: '/',
    isProduction: true,
  };
}

/**
 * Get the current deployment platform
 */
export function getDeploymentPlatform(): DeploymentPlatform {
  return getDeploymentConfig().platform;
}

/**
 * Check if running on a specific platform
 */
export function isRunningOn(platform: DeploymentPlatform): boolean {
  return getDeploymentPlatform() === platform;
}
