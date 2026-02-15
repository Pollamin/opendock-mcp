---
name: update-docs
description: This skill should be used when the user asks to "update the docs", "sync the docs", "check if docs are up to date", "update README", "update CLAUDE.md", or wants to ensure project documentation matches the actual codebase.
---

# Update Docs

Scan the repository and update both `README.md` and `CLAUDE.md` to accurately reflect the current state of the codebase. Only document what actually exists — never add speculative content.

## Step 1: Gather Facts from Source Code

Collect the following by reading actual source files (never rely on existing docs):

1. **All tools** — Grep for `server.registerTool(` or `server.tool(` across `src/` to get every tool name. Count them. Group by file/category.
2. **Project structure** — Glob `src/**/*.ts` (excluding `*.test.ts`) and build the file tree. Note tool count per file (e.g. `# 3 tools`).
3. **Test files** — Glob `src/**/*.test.ts` and list them all.
4. **Exported helpers** — Read `src/tools/index.ts` for exported functions (e.g. `jsonResponse`, `textResponse`).
5. **Exported types** — Grep for `export type` across `src/` to find type aliases (e.g. `QueryParams`).
6. **API patterns** — Check how tools call the API (`api.request()`), how auth works, and the tool registration method (`server.registerTool` vs `server.tool`).
7. **package.json** — Read for version, scripts, dependencies, and npm package name.
8. **Environment variables** — Read `src/config.ts` for env var names and defaults.
9. **tsconfig.json** — Check for notable config (e.g. test exclusions).

## Step 2: Compare Against Existing Docs

Read `README.md` and `CLAUDE.md`. For each, identify:

- **Stale info** — tool counts, tool lists, file trees, helper names, API method names, test file lists that no longer match source code.
- **Missing info** — new tools, helpers, types, test files, or scripts not yet documented.
- **Wrong info** — incorrect function names, wrong patterns described, outdated conventions.

## Step 3: Update the Docs

Apply edits to fix every discrepancy found. Preserve the existing structure and tone of each file — only change what is actually wrong or missing.

### README.md
- Correct the tool count and tool table.
- Ensure all tool categories and tool names are listed.
- Keep user-facing sections (Install, Auth, Usage) accurate.

### CLAUDE.md
- Correct the project structure tree (file list + tool count annotations).
- Correct the Key Conventions section (helper names, API patterns, registration method).
- Correct the Testing section (list all test files).
- Add any new helpers or types to the conventions.

## Step 4: Verify

Re-read both files end-to-end after editing. Confirm they are consistent with each other and with the source code. Fix any remaining issues.
