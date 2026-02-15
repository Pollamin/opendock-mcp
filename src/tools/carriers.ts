import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerCarrierTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_carriers",
    {
      description: "List carriers with optional filters",
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        name: z.string().optional().describe("Filter by carrier name"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/carrier",
        query: params as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_carrier",
    {
      description: "Get details for a specific carrier",
      inputSchema: {
        id: z.string().describe("Carrier ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/carrier/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "create_carrier",
    {
      description: "Create a new carrier user",
      inputSchema: {
        email: z.string().describe("Carrier email address"),
        phone: z.string().optional().describe("Carrier phone number"),
        firstName: z.string().optional().describe("First name"),
        lastName: z.string().optional().describe("Last name"),
        companyName: z.string().optional().describe("Company name"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/carrier",
        body: params,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_carrier",
    {
      description: "Update a carrier user",
      inputSchema: {
        id: z.string().describe("Carrier ID"),
        phone: z.string().optional().describe("Phone number"),
        firstName: z.string().optional().describe("First name"),
        lastName: z.string().optional().describe("Last name"),
        companyName: z.string().optional().describe("Company name"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/carrier/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_booked_carriers",
    {
      description: "Get carriers that have booked appointments",
    },
    async () => {
      const data = await api.request({ path: "/carrier/booked" });
      return jsonResponse(data);
    }
  );
}
