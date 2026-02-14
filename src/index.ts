#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { AuthManager } from "./api/auth.js";
import { ApiClient } from "./api/client.js";
import { registerAllTools } from "./tools/index.js";

const config = loadConfig();
const auth = new AuthManager(config);
const api = new ApiClient(config.apiUrl, auth);

const server = new McpServer({
  name: "opendock",
  version: "1.0.0",
});

registerAllTools(server, api);

const transport = new StdioServerTransport();
await server.connect(transport);
