# Opendock MCP Server

[![npm version](https://img.shields.io/npm/v/opendock-mcp.svg)](https://www.npmjs.com/package/opendock-mcp)

An [MCP](https://modelcontextprotocol.io/) server that connects AI assistants (Claude, etc.) to the [Opendock](https://www.opendock.com/) Neutron API for warehouse dock scheduling.

## Install

No clone or build needed — just use `npx`:

```bash
npx -y opendock-mcp
```

Or install globally:

```bash
npm install -g opendock-mcp
```

## Tools

**17 tools** across 6 categories:

| Category | Tools |
|----------|-------|
| **Auth** | `get_profile` |
| **Warehouses** | `list_warehouses`, `get_warehouse`, `get_warehouse_hours` |
| **Docks** | `list_docks`, `get_dock` |
| **Load Types** | `list_load_types`, `get_load_type`, `get_load_type_availability` |
| **Appointments** | `list_appointments`, `search_appointments`, `get_appointment`, `create_appointment`, `update_appointment`, `delete_appointment` |
| **Carriers** | `list_carriers`, `get_carrier` |

## Prerequisites

- Node.js 18+
- An Opendock account with API access

## Authentication

The server supports two authentication methods:

**Option 1: Username/password** (recommended) — the server handles login and token refresh automatically.

```
OPENDOCK_USERNAME=user@example.com
OPENDOCK_PASSWORD=your-password
```

**Option 2: Pre-existing JWT token**

```
OPENDOCK_TOKEN=your-jwt-token
```

Optionally set the API URL (defaults to `https://neutron.opendock.com`):

```
OPENDOCK_API_URL=https://neutron.opendock.com
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opendock": {
      "command": "npx",
      "args": ["-y", "opendock-mcp"],
      "env": {
        "OPENDOCK_USERNAME": "user@example.com",
        "OPENDOCK_PASSWORD": "your-password"
      }
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add opendock -- npx -y opendock-mcp
```

Set the required environment variables before launching Claude Code, or pass them in the MCP config.

## Testing

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to test interactively:

```bash
OPENDOCK_USERNAME=user@example.com OPENDOCK_PASSWORD=your-password \
  npx @modelcontextprotocol/inspector npx -y opendock-mcp
```

## Development

```bash
git clone https://github.com/Pollamin/opendock-mcp.git
cd opendock-mcp
npm install
npm run build
```

## License

MIT
