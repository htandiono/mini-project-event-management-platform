import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("presentation hostname routing", () => {
  it("rewrites the presentation subdomain root to the presentation route", () => {
    const response = proxy(new NextRequest("https://presentation.eventure.cloud/"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://presentation.eventure.cloud/presentation",
    );
  });

  it("leaves the product domain root unchanged", () => {
    const response = proxy(new NextRequest("https://eventure.cloud/"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("leaves non-root presentation paths unchanged", () => {
    const response = proxy(
      new NextRequest("https://presentation.eventure.cloud/presentation"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
