# Archive (Non-Essential Files)

This folder contains documentation, logs, backups, and developer utility scripts that are not required to run or build the website in production.

What was moved here:

- Root-level Markdown and TXT documentation (setup guides, audits, integration notes)
- Backup files (e.g., `App_backup.tsx`, `App_original.tsx`)
- Local utility scripts and logs (e.g., `check-servers.ps1`, `create-hero-content.js`, `test-*.js`, `dev-server.log`)
- The historical folder `backup-before-figma/`

Safe to remove from deployments, but useful for:

- Developer onboarding and local troubleshooting
- Reference during integration and maintenance

If you need any file back in the project root, simply move it out of this folder.
