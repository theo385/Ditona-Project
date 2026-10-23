---
name: ecc-security-audit
description: Audit an owned or explicitly authorized web app for vulnerabilities, remediate confirmed issues, and rerun the same non-destructive checks.
---

# ECC Security Audit

Use this skill for an authorized security assessment of a web application and its source code. Keep the scope limited to the repository, local development server, or domains explicitly named by the user.

## Scope and safety

- Before contacting a non-local URL, confirm the exact domain is in scope. Treat the repository owner or the user's explicit authorization as sufficient for the DITONA application only.
- Use non-destructive checks: static review, dependency audit, security-header inspection, normal authentication-flow checks, validation tests using harmless values, and access-control checks with accounts supplied for testing.
- Do not brute-force credentials, bypass authentication, exfiltrate data, send bulk requests, modify production data, or test third-party systems.
- If an observation could affect real users or data, stop and explain the proposed test before performing it.

## Workflow

1. Establish the target, deployment environment, and available test accounts. Start locally when possible.
2. Record a baseline: dependency findings, exposed secrets/configuration, authentication and password-reset flow, authorization boundaries, input handling, redirects, HTTP security headers, and client-side data exposure.
3. Report each finding with evidence, impact, severity, and the smallest safe remediation. Do not call a behavior a vulnerability without evidence.
4. Apply only agreed fixes, then rerun the exact affected checks and record the before/after result.
5. Finish with a concise residual-risk list and deployment actions such as rotating exposed credentials or configuring production headers.

## Recommended checks for this repository

- Run the production build and the package-manager dependency audit.
- Search tracked source/configuration for secrets, public keys used incorrectly, unsafe HTML insertion, and missing origin/redirect validation.
- Review Supabase authentication redirect URLs, SMTP configuration, Row Level Security, and whether privileged keys are absent from browser code.
- Exercise signup, login, logout, password reset, and protected-page behavior against a local server using a dedicated test account.
- For a deployed DITONA URL explicitly provided by the user, inspect only normal public routes and response headers before any deeper test.

## Reporting format

Use: **finding**, **evidence**, **impact**, **severity**, **remediation**, and **retest result**. Separate confirmed vulnerabilities from configuration recommendations and false positives.
