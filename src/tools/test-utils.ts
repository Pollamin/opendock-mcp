import { vi } from "vitest";

export function mockServer() {
  const tools = new Map<string, { opts: any; handler: Function }>();
  const prompts = new Map<string, { config: any; callback: Function }>();
  return {
    registerTool: vi.fn((name: string, opts: any, handler: Function) => {
      tools.set(name, { opts, handler });
    }),
    registerPrompt: vi.fn((name: string, config: any, callback: Function) => {
      prompts.set(name, { config, callback });
    }),
    tools,
    prompts,
    call(name: string, params: any) {
      const tool = tools.get(name);
      if (!tool) throw new Error(`Tool "${name}" not registered`);
      return tool.handler(params);
    },
    callPrompt(name: string, args: any) {
      const prompt = prompts.get(name);
      if (!prompt) throw new Error(`Prompt "${name}" not registered`);
      return prompt.callback(args, {});
    },
  };
}

export function mockApi() {
  return { request: vi.fn() };
}
