# Security Review - Family Tree Application

**Date:** 2025-10-01  
**Status:** Security vulnerabilities identified - action required

## Executive Summary

This document outlines security findings from a comprehensive review of the Family Tree GEDCOM application. Several high-priority vulnerabilities were identified in the edge functions that require immediate attention.

---

## High-Priority Findings

### 1. Public Edge Functions (CRITICAL)

**Severity:** HIGH  
**Risk:** Service abuse, unexpected costs, unauthorized access

All 4 edge functions are currently publicly accessible without authentication:
- `google-ai-insights`
- `replicate-enhance`
- `huggingface-analyze`
- `dev-notes-ai`

**Current Configuration:**
```toml
[functions.google-ai-insights]
verify_jwt = false

[functions.replicate-enhance]
verify_jwt = false

[functions.huggingface-analyze]
verify_jwt = false

[functions.dev-notes-ai]
verify_jwt = false
```

**Impact:**
- Anyone can call these endpoints without authentication
- Potential for abuse leading to high API costs from third-party services
- No way to track or limit usage per user

---

### 2. Missing Input Validation (HIGH)

**Severity:** HIGH  
**Risk:** Service abuse, injection attacks, system instability

Edge functions lack proper input validation:

#### `google-ai-insights/index.ts`
- No size limit for `familyData` payload
- No validation on prompt length
- Could accept massive payloads causing memory issues

#### `replicate-enhance/index.ts`
- No URL validation for `imageUrl` parameter
- Accepts any URL without domain whitelisting
- No validation on prompt length

#### `huggingface-analyze/index.ts`
- No maximum length for `text` input
- Task parameter not validated against enum
- Could be exploited for excessive API usage

#### `dev-notes-ai/index.ts`
- No limit on `notes` length
- Could send arbitrarily large text to AI service

**Impact:**
- Attackers could send massive payloads
- Potential denial-of-service through resource exhaustion
- Unexpected costs from third-party API usage

---

## Positive Findings

### ✅ Proper Secret Management
- API keys stored as environment variables
- No hardcoded credentials in code
- Secrets properly configured in Supabase

### ✅ CORS Configuration
- Appropriate CORS headers configured
- OPTIONS requests properly handled

### ✅ No Database Yet
- No database tables created yet
- No RLS policy concerns at this stage

### ✅ Clean Frontend Code
- No sensitive data in frontend code
- No hardcoded API endpoints

---

## Security Improvement Plan

### Phase 1: Critical Fixes (IMMEDIATE)

#### 1.1 Implement Input Validation

Add zod schemas to all edge functions:

**For `google-ai-insights`:**
```typescript
import { z } from 'zod';

const requestSchema = z.object({
  familyData: z.string().max(50000, 'Family data too large'),
  prompt: z.string().max(2000, 'Prompt too long').optional()
});
```

**For `replicate-enhance`:**
```typescript
const requestSchema = z.object({
  imageUrl: z.string().url('Invalid URL').max(500),
  prompt: z.string().max(1000).optional()
});
```

**For `huggingface-analyze`:**
```typescript
const requestSchema = z.object({
  text: z.string().max(5000, 'Text too long'),
  task: z.enum(['summarization', 'sentiment-analysis', 'ner']).optional()
});
```

**For `dev-notes-ai`:**
```typescript
const requestSchema = z.object({
  notes: z.string().max(10000, 'Notes too long')
});
```

#### 1.2 Enable JWT Authentication

Remove `verify_jwt = false` from all functions in `supabase/config.toml`:

```toml
# Remove or comment out these lines to enable JWT verification
# [functions.google-ai-insights]
# verify_jwt = false
```

Add authentication checks in edge functions:

```typescript
// Get user from JWT
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Missing authorization header' }),
    { status: 401, headers: corsHeaders }
  );
}
```

#### 1.3 Add Rate Limiting

Implement basic rate limiting:

```typescript
// Example rate limiting logic
const userKey = `rate_limit_${userId}`;
const requestCount = await checkRequestCount(userKey);

if (requestCount > 10) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
    { status: 429, headers: corsHeaders }
  );
}
```

---

### Phase 2: Enhanced Security (RECOMMENDED)

#### 2.1 Request Validation Middleware
- Create shared validation utilities
- Sanitize all user inputs
- Implement request size limits

#### 2.2 Monitoring and Alerting
- Log suspicious activity
- Set up alerts for unusual patterns
- Track API costs and set spending limits

#### 2.3 Security Headers
- Verify response security headers
- Add Content-Security-Policy headers

---

### Phase 3: Future Considerations (OPTIONAL)

#### 3.1 User Authentication System
- Implement Supabase Auth if adding user-specific features
- Set up Row Level Security (RLS) policies

#### 3.2 API Key Rotation
- Document key rotation process
- Set up key expiration policies
- Implement key versioning

---

## Timeline

| Priority | Action | Estimated Time | Status |
|----------|--------|----------------|--------|
| CRITICAL | Input validation | 2-3 hours | ⏳ Pending |
| CRITICAL | Enable JWT auth | 1-2 hours | ⏳ Pending |
| CRITICAL | Rate limiting | 2-3 hours | ⏳ Pending |
| HIGH | Monitoring setup | 1-2 hours | ⏳ Pending |
| MEDIUM | Security headers | 1 hour | ⏳ Pending |
| LOW | Auth system | 4-6 hours | ⏳ Pending |

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Edge functions require valid JWT tokens
- [ ] Input validation rejects oversized payloads
- [ ] Rate limiting blocks excessive requests
- [ ] Error messages don't leak sensitive information
- [ ] CORS headers still work correctly
- [ ] Logging captures security events
- [ ] API costs are within expected ranges

---

## Contact

For questions about this security review, please refer to the project documentation or reach out to the development team.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-01 | Initial security review |
