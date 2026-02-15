import { describe, it, expect, beforeEach } from "vitest";
import { registerMetricsTools } from "./metrics.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("metrics tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerMetricsTools(server as any, api as any);
  });

  it("registers 21 metrics tools", () => {
    expect(server.tools.size).toBe(21);
  });

  // --- Simple GET endpoints (no input, just path) ---

  const simpleGetTools: Array<[string, string]> = [
    ["get_appointment_volume_by_date", "/metrics/appointment-volume/date"],
    ["get_appointment_volume_by_carrier", "/metrics/appointment-volume/carrier"],
    ["get_appointment_volume_by_load_type", "/metrics/appointment-volume/load-type"],
    ["get_appointment_volume_by_time_of_day", "/metrics/appointment-volume/time-of-day"],
    ["get_appointment_volume_by_day_of_week", "/metrics/appointment-volume/day-of-week"],
    ["get_appointment_avg_duration_by_load_type", "/metrics/appointment-volume/average-duration-by-load-type"],
    ["get_appointment_avg_duration_by_status", "/metrics/appointment-volume/status"],
    ["get_appointment_avg_duration_by_dock_and_status", "/metrics/appointment-volume/status-by-dock"],
    ["get_appointment_count_by_status_for_carrier", "/metrics/counts/appointment-count-for-carrier/status"],
    ["get_carrier_status_percentages", "/metrics/carrier/status-percentages"],
  ];

  it.each(simpleGetTools)("%s sends GET %s", async (name, path) => {
    api.request.mockResolvedValueOnce([]);
    await server.call(name, {});
    expect(api.request).toHaveBeenCalledWith({ path });
  });

  // --- Simple POST endpoints (no input, empty body) ---

  const simplePostTools: Array<[string, string]> = [
    ["get_appointment_status_times", "/metrics/appointments/status-times"],
    ["get_first_available_appointment", "/metrics/loadtype/first-avail-appt"],
    ["get_warehouse_insights", "/metrics/warehouse"],
    ["export_yard_data_excel", "/metrics/yard/excel"],
  ];

  it.each(simplePostTools)("%s sends POST %s", async (name, path) => {
    api.request.mockResolvedValueOnce({});
    await server.call(name, {});
    expect(api.request).toHaveBeenCalledWith({ method: "POST", path, body: {} });
  });

  // --- Tools with unique input schemas ---

  it("get_appointment_count_for_carrier sends GET with carrierId query param", async () => {
    api.request.mockResolvedValueOnce({ count: 5 });
    await server.call("get_appointment_count_for_carrier", { carrierId: "c1" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/metrics/counts/appointment-count-for-carrier",
      query: { carrierId: "c1" },
    });
  });

  it("get_appointment_count_for_docks sends GET with dockIds query param", async () => {
    api.request.mockResolvedValueOnce([]);
    await server.call("get_appointment_count_for_docks", { dockIds: ["d1", "d2"] });
    expect(api.request).toHaveBeenCalledWith({
      path: "/metrics/counts/appointment-count-for-docks",
      query: { dockIds: ["d1", "d2"] },
    });
  });

  it("get_reserve_count_for_user sends GET with optional userId", async () => {
    api.request.mockResolvedValueOnce({ count: 3 });
    await server.call("get_reserve_count_for_user", { userId: "u1" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/metrics/counts/reserve-count-for-user",
      query: { userId: "u1" },
    });
  });

  it("get_dock_dwell_time sends GET with optional query params", async () => {
    api.request.mockResolvedValueOnce([]);
    await server.call("get_dock_dwell_time", { warehouseId: "w1", fromDate: "2026-01-01" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/metrics/dock/dwell-time",
      query: { warehouseId: "w1", fromDate: "2026-01-01" },
    });
  });

  it("list_appointment_metrics sends POST /metrics-v2/appointments", async () => {
    api.request.mockResolvedValueOnce([]);
    await server.call("list_appointment_metrics", { dockIds: ["d1"], allCarriers: true });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/metrics-v2/appointments",
      body: { dockIds: ["d1"], allCarriers: true },
    });
  });

  it("export_appointment_metrics_excel sends POST with emailCCs as query", async () => {
    api.request.mockResolvedValueOnce({ url: "https://example.com/file.xlsx" });
    await server.call("export_appointment_metrics_excel", {
      emailCCs: ["a@b.com"],
      dockIds: ["d1"],
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/metrics/appointments/excel",
      query: { emailCCs: ["a@b.com"] },
      body: { dockIds: ["d1"] },
    });
  });

  it("get_warehouse_capacity_usage sends POST /metrics/warehouse/capacity-usage", async () => {
    api.request.mockResolvedValueOnce({});
    await server.call("get_warehouse_capacity_usage", { dockIds: ["d1"] });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/metrics/warehouse/capacity-usage",
      body: { dockIds: ["d1"] },
    });
  });
});
