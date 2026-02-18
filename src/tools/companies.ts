import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ApiClient, QueryParams } from "../api/client.js";
import { jsonResponse } from "./index.js";

export function registerCompanyTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_companies",
    {
      description: "List carrier companies with optional filters and pagination",
      inputSchema: {
        page: z.number().optional().describe("Page number"),
        limit: z.number().optional().describe("Items per page"),
        s: z.string().optional().describe("NestJSX/Crud search JSON (e.g. '{\"name\":{\"$contL\":\"acme\"}}')"),
        sort: z.array(z.string()).optional().describe("Sort directives, each as 'field,ASC' or 'field,DESC'"),
        join: z.array(z.string()).optional().describe("Relations to join"),
        cache: z.number().optional().describe("Set to 0 to bypass cache"),
      },
    },
    async (params) => {
      const data = await api.request({
        path: "/company",
        query: params as QueryParams,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "get_company",
    {
      description: "Get details for a specific carrier company",
      inputSchema: {
        id: z.string().describe("Company ID"),
      },
    },
    async ({ id }) => {
      const data = await api.request({ path: `/company/${id}` });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "update_company",
    {
      description: "Update a carrier company",
      inputSchema: {
        id: z.string().describe("Company ID"),
        name: z.string().optional().describe("Company name"),
        scac: z.string().optional().describe("SCAC code"),
        mc: z.string().optional().describe("MC number"),
        usdot: z.string().optional().describe("USDOT number"),
        type: z.enum(["type_broker", "type_carrier", "type_carrier_broker", "type_forwarder"]).optional().describe("Company type"),
      },
    },
    async ({ id, ...body }) => {
      const data = await api.request({
        method: "PATCH",
        path: `/company/${id}`,
        body,
      });
      return jsonResponse(data);
    }
  );

  server.registerTool(
    "create_company",
    {
      description: "Create a new carrier company",
      inputSchema: {
        name: z.string().optional().describe("Company name"),
        scac: z.string().optional().describe("SCAC code"),
        mc: z.string().optional().describe("MC number"),
        usdot: z.string().optional().describe("USDOT number"),
        type: z.enum(["type_broker", "type_carrier", "type_carrier_broker", "type_forwarder"]).optional().describe("Company type"),
      },
    },
    async (params) => {
      const data = await api.request({
        method: "POST",
        path: "/company",
        body: params,
      });
      return jsonResponse(data);
    }
  );
}
