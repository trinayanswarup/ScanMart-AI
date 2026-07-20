import { beforeEach, vi } from "vitest";

beforeEach(() => {
  // localStorage is only available in the jsdom environment (not in node)
  if (typeof localStorage !== "undefined") localStorage.clear();
  vi.restoreAllMocks();
});
