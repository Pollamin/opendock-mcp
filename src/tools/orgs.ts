import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerOrgTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "get_org",
    {
      description: "Get details for an organization",
      inputSchema: {
        id: z.string().describe("Organization ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/org/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_org",
    {
      description: "Update an organization",
      inputSchema: {
        id: z.string().describe("Organization ID"),
        name: z.string().optional().describe("Organization name"),
        settings: z.record(z.unknown()).optional().describe("Organization settings"),
        favoriteCarrierIds: z.array(z.string()).optional().describe("List of favorite carrier IDs"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/org/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_favorite_carriers",
    {
      description: "Update the list of favorite carriers for an organization",
      inputSchema: {
        orgId: z.string().describe("Organization ID"),
        carrierIds: z.array(z.string()).describe("List of carrier IDs to set as favorites"),
      },
    },
    async ({ orgId, carrierIds }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/org/${orgId}/favorite-carriers`,
        body: carrierIds,
      });
      return jsonResponse(data);
    }
  );
}
