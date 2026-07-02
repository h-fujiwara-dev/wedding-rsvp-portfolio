/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

function makeFakeMql(initialMatches: boolean) {
  const listeners: Record<string, ((e: { matches: boolean }) => void)[]> = {};
  const mql = {
    matches: initialMatches,
    addEventListener: vi.fn((event: string, cb: (e: { matches: boolean }) => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: (e: { matches: boolean }) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((l) => l !== cb);
    }),
    fire(event: string) {
      for (const cb of listeners[event] ?? []) cb({ matches: mql.matches });
    },
  };
  return mql;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePrefersReducedMotion", () => {
  it("returns false when matchMedia initially reports no preference", () => {
    const mql = makeFakeMql(false);
    vi.stubGlobal("matchMedia", vi.fn(() => mql));

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when matchMedia initially reports a reduced-motion preference", () => {
    const mql = makeFakeMql(true);
    vi.stubGlobal("matchMedia", vi.fn(() => mql));

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("calls matchMedia with the exact reduced-motion query", () => {
    const mql = makeFakeMql(false);
    const matchMediaSpy = vi.fn(() => mql);
    vi.stubGlobal("matchMedia", matchMediaSpy);

    renderHook(() => usePrefersReducedMotion());
    expect(matchMediaSpy).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("registers a change listener on mount", () => {
    const mql = makeFakeMql(false);
    vi.stubGlobal("matchMedia", vi.fn(() => mql));

    renderHook(() => usePrefersReducedMotion());
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("updates the returned value when the media query change fires", () => {
    const mql = makeFakeMql(false);
    vi.stubGlobal("matchMedia", vi.fn(() => mql));

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mql.matches = true;
      mql.fire("change");
    });

    expect(result.current).toBe(true);
  });

  it("removes the same listener reference on unmount", () => {
    const mql = makeFakeMql(false);
    vi.stubGlobal("matchMedia", vi.fn(() => mql));

    const { unmount } = renderHook(() => usePrefersReducedMotion());
    const registeredHandler = mql.addEventListener.mock.calls[0][1];

    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith("change", registeredHandler);
  });
});
