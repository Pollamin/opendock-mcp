import { describe, it, expect, beforeEach } from "vitest";
import { registerAppointmentTools } from "./appointments.js";
import { mockServer, mockApi } from "./test-utils.js";

describe("appointment tools", () => {
  let server: ReturnType<typeof mockServer>;
  let api: ReturnType<typeof mockApi>;

  beforeEach(() => {
    server = mockServer();
    api = mockApi();
    registerAppointmentTools(server as any, api as any);
  });

  it("registers all 12 appointment tools", () => {
    expect(server.tools.size).toBe(12);
  });

  // --- list_appointments ---

  it("list_appointments sends GET /appointment with query params", async () => {
    api.request.mockResolvedValueOnce([{ id: "a1" }]);
    const result = await server.call("list_appointments", { page: 1, limit: 10, warehouseId: "w1" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { page: 1, limit: 10, warehouseId: "w1", s: undefined },
    });
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "a1" }]);
  });

  it("list_appointments builds s= from startDate only", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    await server.call("list_appointments", { startDate: "2026-01-01" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { s: JSON.stringify({ start: { $gte: "2026-01-01T00:00:00.000Z" } }) },
    });
  });

  it("list_appointments builds s= from endDate only", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    await server.call("list_appointments", { endDate: "2026-12-31" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { s: JSON.stringify({ start: { $lte: "2026-12-31T23:59:59.999Z" } }) },
    });
  });

  it("list_appointments builds s= with $and from startDate + endDate", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    await server.call("list_appointments", { startDate: "2026-01-01", endDate: "2026-12-31" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: {
        s: JSON.stringify({
          $and: [
            { start: { $gte: "2026-01-01T00:00:00.000Z" } },
            { start: { $lte: "2026-12-31T23:59:59.999Z" } },
          ],
        }),
      },
    });
  });

  it("list_appointments passes raw s= and ignores startDate/endDate", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    const raw = '{"status":"Scheduled"}';
    await server.call("list_appointments", { s: raw, startDate: "2026-01-01" });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { s: raw },
    });
  });

  it("list_appointments passes join as array", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    await server.call("list_appointments", { join: ["user||email,companyId", "user.company||name"] });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { s: undefined, join: ["user||email,companyId", "user.company||name"] },
    });
  });

  it("list_appointments passes sort as array", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    await server.call("list_appointments", { sort: ["start,ASC", "status,DESC"] });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { s: undefined, sort: ["start,ASC", "status,DESC"] },
    });
  });

  it("list_appointments passes fields, offset, and cache", async () => {
    api.request.mockResolvedValueOnce({ data: [] });
    await server.call("list_appointments", { fields: "refNumber,start", offset: 20, cache: 0 });
    expect(api.request).toHaveBeenCalledWith({
      path: "/appointment",
      query: { fields: "refNumber,start", offset: 20, cache: 0, s: undefined },
    });
  });

  // --- search_appointments ---

  it("search_appointments sends POST with structured body", async () => {
    api.request.mockResolvedValueOnce({ results: [] });
    const result = await server.call("search_appointments", { searchStr: "thing", statuses: ["Scheduled"] });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/search/appointments",
      body: {
        searchStr: "thing",
        statuses: ["Scheduled"],
        sort: { sortBy: "appointment.start", sortDesc: false },
        pagination: { size: 10, from: 0 },
      },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ results: [] });
  });

  it("search_appointments supports custom sort and pagination", async () => {
    api.request.mockResolvedValueOnce({ results: [] });
    await server.call("search_appointments", {
      searchStr: "test",
      sortBy: "appointment.status",
      sortDesc: true,
      size: 25,
      from: 50,
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/search/appointments",
      body: {
        searchStr: "test",
        sort: { sortBy: "appointment.status", sortDesc: true },
        pagination: { size: 25, from: 50 },
      },
    });
  });

  // --- get_appointment ---

  it("get_appointment sends GET /appointment/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "a1", status: "Scheduled" });
    const result = await server.call("get_appointment", { id: "a1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/appointment/a1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "a1", status: "Scheduled" });
  });

  // --- create_appointment ---

  it("create_appointment sends POST /appointment", async () => {
    api.request.mockResolvedValueOnce({ id: "a2" });
    const params = { warehouseId: "w1", dockId: "d1", loadTypeId: "lt1", startTime: "2026-01-01T08:00:00Z", endTime: "2026-01-01T09:00:00Z" };
    const result = await server.call("create_appointment", params);
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/appointment",
      body: params,
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "a2" });
  });

  // --- update_appointment ---

  it("update_appointment sends PATCH /appointment/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "a1", status: "InProgress" });
    const result = await server.call("update_appointment", { id: "a1", status: "InProgress" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/appointment/a1",
      body: { status: "InProgress" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "a1", status: "InProgress" });
  });

  // --- delete_appointment ---

  it("delete_appointment sends DELETE /appointment/:id", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("delete_appointment", { id: "a1" });
    expect(api.request).toHaveBeenCalledWith({ method: "DELETE", path: "/appointment/a1" });
    expect(result.content[0].text).toContain("a1");
    expect(result.content[0].text).toContain("deleted");
  });

  // --- get_public_appointment ---

  it("get_public_appointment sends GET /appointment/public/:id", async () => {
    api.request.mockResolvedValueOnce({ id: "a1", refNumber: "REF123" });
    const result = await server.call("get_public_appointment", { id: "a1" });
    expect(api.request).toHaveBeenCalledWith({ path: "/appointment/public/a1" });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "a1", refNumber: "REF123" });
  });

  // --- undo_appointment_status ---

  it("undo_appointment_status sends PATCH /appointment/:id/undo-latest-status", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("undo_appointment_status", { id: "a1" });
    expect(api.request).toHaveBeenCalledWith({
      method: "PATCH",
      path: "/appointment/a1/undo-latest-status",
    });
    expect(result.content[0].text).toContain("a1");
  });

  // --- create_recurring_appointments ---

  it("create_recurring_appointments sends POST /appointment/:id/recurring", async () => {
    api.request.mockResolvedValueOnce({ created: 4 });
    const result = await server.call("create_recurring_appointments", {
      id: "a1",
      numWeeks: 4,
      weekDays: ["Monday", "Wednesday"],
      copyFields: ["refNumber", "notes"],
    });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/appointment/a1/recurring",
      body: {
        numWeeks: 4,
        weekDays: ["Monday", "Wednesday"],
        copyFields: ["refNumber", "notes"],
      },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ created: 4 });
  });

  // --- delete_recurring_appointments ---

  it("delete_recurring_appointments sends DELETE /appointment/:id/recurring", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("delete_recurring_appointments", { id: "a1" });
    expect(api.request).toHaveBeenCalledWith({ method: "DELETE", path: "/appointment/a1/recurring" });
    expect(result.content[0].text).toContain("a1");
  });

  // --- add_appointment_tag ---

  it("add_appointment_tag sends POST /appointment/:id/tag", async () => {
    api.request.mockResolvedValueOnce({ id: "a1", tags: ["Damaged"] });
    const result = await server.call("add_appointment_tag", { id: "a1", tag: "Damaged" });
    expect(api.request).toHaveBeenCalledWith({
      method: "POST",
      path: "/appointment/a1/tag",
      body: { tag: "Damaged" },
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "a1", tags: ["Damaged"] });
  });

  // --- remove_appointment_tag ---

  it("remove_appointment_tag sends DELETE /appointment/:id/tag", async () => {
    api.request.mockResolvedValueOnce(undefined);
    const result = await server.call("remove_appointment_tag", { id: "a1", tag: "Damaged" });
    expect(api.request).toHaveBeenCalledWith({
      method: "DELETE",
      path: "/appointment/a1/tag",
      body: { tag: "Damaged" },
    });
    expect(result.content[0].text).toContain("Damaged");
    expect(result.content[0].text).toContain("a1");
  });
});
