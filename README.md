# Opendock MCP Server

[![npm version](https://img.shields.io/npm/v/opendock-mcp.svg)](https://www.npmjs.com/package/opendock-mcp)

An [MCP](https://modelcontextprotocol.io/) server that connects AI assistants (Claude, etc.) to the legendary [Opendock](https://www.opendock.com/) Neutron API.

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

**42 tools** across 8 categories:

| Category | Tools |
|----------|-------|
| **General** | `get_version`, `get_profile` |
| **Warehouses** | `list_warehouses`, `get_warehouse`, `get_warehouse_hours`, `create_warehouse`, `update_warehouse`, `delete_warehouse` |
| **Docks** | `list_docks`, `get_dock`, `create_dock`, `update_dock`, `delete_dock`, `sort_docks`, `get_dock_availability` |
| **Load Types** | `list_load_types`, `get_load_type`, `get_load_type_availability`, `create_load_type`, `update_load_type`, `delete_load_type` |
| **Appointments** | `list_appointments`, `search_appointments`, `get_appointment`, `create_appointment`, `update_appointment`, `delete_appointment`, `get_public_appointment`, `undo_appointment_status`, `create_recurring_appointments`, `delete_recurring_appointments`, `add_appointment_tag`, `remove_appointment_tag` |
| **Carriers** | `list_carriers`, `get_carrier`, `create_carrier`, `update_carrier`, `get_booked_carriers` |
| **Orgs** | `get_org`, `update_org`, `update_favorite_carriers` |
| **Audit Log** | `get_audit_log` |

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
