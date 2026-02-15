import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerSettingsMetadataTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "get_settings_metadata",
    {
      description: "Get all settings metadata for an entity type",
      inputSchema: {
        entityType: z.string().describe("Entity type (e.g. 'warehouse', 'dock', 'appointment')"),
      },
    },
    async ({ entityType }) => {
      const data = await api.request({ path: `/settings-metadata/${entityType}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_setting_metadata",
    {
      description: "Get a specific setting metadata entry by entity type and setting key",
      inputSchema: {
        entityType: z.string().describe("Entity type (e.g. 'warehouse', 'dock', 'appointment')"),
        settingKey: z.string().describe("Setting key"),
      },
    },
    async ({ entityType, settingKey }) => {
      const data = await api.request({ path: `/settings-metadata/${entityType}/${settingKey}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "validate_settings_metadata",
    {
      description: "Validate settings for an entity type",
      inputSchema: {
        entityType: z.string().describe("Entity type (e.g. 'warehouse', 'dock', 'appointment')"),
      },
    },
    async ({ entityType }) => {
      const data = await api.request({
        method: "POST",
        path: `/settings-metadata/validate/${entityType}`,
      });
      return jsonResponse(data);
    }
  );
}
