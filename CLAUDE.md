# Opendock MCP Server

MCP server for the Opendock Neutron API. TypeScript, STDIO transport.

## Build & Run

```bash
npm run build    # tsc → dist/
npm run start    # node dist/index.js
npm run dev      # tsc --watch
```

## Project Structure

```
src/
├── index.ts              # Entry point: McpServer + StdioServerTransport
├── config.ts             # Env var loading (OPENDOCK_API_URL, USERNAME, PASSWORD, TOKEN)
├── api/
│   ├── auth.ts           # AuthManager: login, refresh, JWT decode (no external lib)
│   └── client.ts         # ApiClient: fetch wrapper, auth headers, 401 auto-retry
└── tools/
    ├── index.ts          # registerAllTools() + get_profile tool
    ├── warehouses.ts     # 3 tools
    ├── docks.ts          # 2 tools
    ├── loadtypes.ts      # 3 tools
    ├── appointments.ts   # 6 tools
    └── carriers.ts       # 2 tools
```

## Key Conventions

- **ESM only** — `"type": "module"` in package.json, all imports use `.js` extensions
- **No external HTTP library** — uses native `fetch` (Node 18+)
- **No JWT library** — `AuthManager.decodeJwt()` uses `Buffer.from(base64url)`
- **Zod schemas** — each tool defines its input schema inline with `z.string()`, `z.number()`, etc.
- **Tool pattern** — each tool file exports a `register*Tools(server, api)` function that calls `server.tool()`
- **API client pattern** — all tools call `api.request({ method, path, query, body })`, never `fetch` directly
- **`jsonResponse` helper** — `tools/index.ts` exports `jsonResponse(data)` which wraps data as `{ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }`. All tool handlers use it for consistent MCP responses.
- **Auth is lazy** — no network call until first tool invocation; token refreshes proactively 60s before expiry

## Adding a New Tool

1. Add the tool in the appropriate `src/tools/*.ts` file (or create a new file)
2. Use `server.tool(name, description, zodSchema, handler)` — follow existing patterns
3. If new file: export a `register*Tools` function and call it from `src/tools/index.ts`
4. Run `npm run build` to verify

## Publishing

Published to npm as `opendock-mcp`. To publish a new version:

1. Bump version in `package.json`
2. `npm publish --access public` (requires npm login + OTP)
3. `prepublishOnly` script auto-runs `npm run build` before publish

## Environment Variables

- `OPENDOCK_API_URL` — API base URL (default: `https://neutron.opendock.com`)
- `OPENDOCK_USERNAME` + `OPENDOCK_PASSWORD` — credentials for login flow
- `OPENDOCK_TOKEN` — alternative: provide a JWT directly (skips login)
