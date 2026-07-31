import { type NextRequest, NextResponse } from "next/server";

const PRESENTATION_HOST = "presentation.eventure.cloud";

export function proxy(request: NextRequest) {
  const { nextUrl } = request;

  if (nextUrl.hostname !== PRESENTATION_HOST || nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const presentationUrl = nextUrl.clone();
  presentationUrl.pathname = "/presentation";

  return NextResponse.rewrite(presentationUrl);
}

export const config = {
  matcher: "/",
};
