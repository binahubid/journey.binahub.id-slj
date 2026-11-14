import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

function worker() {
  const handlers = new Map<string, (event: Record<string, unknown>) => void>();
  const setAppBadge = vi.fn().mockResolvedValue(undefined);
  const clearAppBadge = vi.fn().mockResolvedValue(undefined);
  const addAll = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue({ postMessage: vi.fn() });
  const self = {
    location: { origin: "https://journey.binahub.id" },
    navigator: { setAppBadge, clearAppBadge },
    registration: { showNotification: vi.fn().mockResolvedValue(undefined) },
    clients: { matchAll: vi.fn().mockResolvedValue([]), openWindow, claim: vi.fn() },
    skipWaiting: vi.fn(),
    addEventListener: (name: string, handler: (event: Record<string, unknown>) => void) => handlers.set(name, handler),
  };
  runInNewContext(readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8"), {
    self, URL,
    caches: { open: vi.fn().mockResolvedValue({ addAll }) },
  });
  async function dispatch(type: string, payload: Record<string, unknown>) {
    let pending: Promise<unknown> | undefined;
    handlers.get(type)?.({ ...payload, waitUntil: (promise: Promise<unknown>) => { pending = promise; } });
    await pending;
  }
  return { setAppBadge, clearAppBadge, addAll, openWindow, dispatch, clients: self.clients, showNotification: self.registration.showNotification };
}

describe("installed app notification behavior", () => {
  it("sets and clears the unread badge through the service worker navigator API", async () => {
    const service = worker();
    await service.dispatch("message", { data: { type: "UPDATE_BADGE", count: 4 } });
    expect(service.setAppBadge).toHaveBeenCalledWith(4);
    await service.dispatch("push", { data: { json: () => ({ badgeCount: 0 }) } });
    expect(service.clearAppBadge).toHaveBeenCalledOnce();
  });
  it("opens the app notification page when a notification contains an external URL", async () => {
    const service = worker();
    await service.dispatch("notificationclick", { notification: { close: vi.fn(), data: { url: "https://example.invalid/sign-in" } } });
    expect(service.openWindow).toHaveBeenCalledWith("https://journey.binahub.id/notifications");
  });
  it("keeps a reminder's selected widget and refreshes unread counts in open app windows", async () => {
    const service = worker();
    const postMessage = vi.fn();
    service.clients.matchAll.mockResolvedValue([{ postMessage }]);
    await service.dispatch("push", { data: { json: () => ({ title: "Habit hari ini", url: "/trial?widget=habits", badgeCount: 3 }) } });
    expect(service.showNotification).toHaveBeenCalledWith("Habit hari ini", expect.objectContaining({
      data: { url: "https://journey.binahub.id/trial?widget=habits" },
    }));
    expect(postMessage).toHaveBeenCalledWith({ type: "SYNC_BADGE" });
  });
  it("keeps an authentication redirect out of the cached public shell", async () => {
    const service = worker();
    await service.dispatch("install", {});
    expect(service.addAll.mock.calls[0][0]).not.toContain("/login");
    expect(service.addAll.mock.calls[0][0]).toContain("/offline");
  });
});
