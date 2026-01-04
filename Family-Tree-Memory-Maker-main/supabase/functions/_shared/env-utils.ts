/**
 * Environment variable normalization utility for Supabase Edge Functions
 * Provides consistent secret name handling and enhanced logging
 */

export interface EnvResult<T = string> {
  value: T | null;
  found: boolean;
  checkedNames: string[];
  error?: string;
}

export interface EnvLogOptions {
  functionName?: string;
  logLevel?: 'info' | 'warn' | 'error';
  maskValue?: boolean;
}

/**
 * Get an environment variable with multiple name variants and enhanced logging
 */
export function getEnvWithVariants(
  variants: string[],
  options: EnvLogOptions = {}
): EnvResult {
  const {
    functionName = 'edge-function',
    logLevel = 'info',
    maskValue = true
  } = options;

  const timestamp = new Date().toISOString();
  const checkedNames: string[] = [];

  console.log(`[${timestamp}] [${functionName}] Checking environment variables:`, variants);

  for (const varName of variants) {
    checkedNames.push(varName);
    const value = Deno.env.get(varName);
    
    if (value) {
      const displayValue = maskValue ? `${value.substring(0, 4)}...` : value;
      console.log(`[${timestamp}] [${functionName}] ✓ Found ${varName}: ${displayValue}`);
      
      return {
        value,
        found: true,
        checkedNames
      };
    } else {
      console.log(`[${timestamp}] [${functionName}] ✗ Not found: ${varName}`);
    }
  }

  const error = `No environment variable found. Checked: ${checkedNames.join(', ')}`;
  
  if (logLevel === 'error') {
    console.error(`[${timestamp}] [${functionName}] ERROR: ${error}`);
  } else if (logLevel === 'warn') {
    console.warn(`[${timestamp}] [${functionName}] WARNING: ${error}`);
  }

  return {
    value: null,
    found: false,
    checkedNames,
    error
  };
}

/**
 * Normalize common secret name patterns
 */
export function normalizeSecretName(baseName: string): string[] {
  const upper = baseName.toUpperCase();
  const variants = [
    upper,
    `${upper}_KEY`,
    `${upper}_API_KEY`,
    `${upper}_SECRET`,
    `${upper}_APP_KEY`,
    `${upper}_CLIENT_ID`,
    `${upper}_TOKEN`
  ];
  
  // Remove duplicates while preserving order
  return [...new Set(variants)];
}

/**
 * Get a required environment variable or throw with helpful error
 */
export function getRequiredEnv(
  varName: string | string[],
  functionName: string = 'edge-function'
): string {
  const variants = Array.isArray(varName) ? varName : [varName];
  const result = getEnvWithVariants(variants, {
    functionName,
    logLevel: 'error',
    maskValue: true
  });

  if (!result.found || !result.value) {
    throw new Error(
      `Missing required environment variable. Checked: ${result.checkedNames.join(', ')}`
    );
  }

  return result.value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(
  varName: string | string[],
  defaultValue: string,
  functionName: string = 'edge-function'
): string {
  const variants = Array.isArray(varName) ? varName : [varName];
  const result = getEnvWithVariants(variants, {
    functionName,
    logLevel: 'info',
    maskValue: true
  });

  return result.value || defaultValue;
}

/**
 * Log all environment variables (masked) for debugging
 */
export function logAllEnvVars(functionName: string = 'edge-function'): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${functionName}] Available environment variables:`);
  
  const envVars = Deno.env.toObject();
  const sortedKeys = Object.keys(envVars).sort();
  
  for (const key of sortedKeys) {
    const value = envVars[key];
    const masked = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '****';
    console.log(`[${timestamp}] [${functionName}]   ${key}: ${masked}`);
  }
}
