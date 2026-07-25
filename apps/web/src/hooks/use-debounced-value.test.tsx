import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "./use-debounced-value";

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("waits 350 milliseconds before publishing a search value", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 350), {
      initialProps: { value: "music" },
    });

    rerender({ value: "music festival" });
    expect(result.current).toBe("music");

    act(() => vi.advanceTimersByTime(349));
    expect(result.current).toBe("music");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("music festival");
  });
});
