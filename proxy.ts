import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const role = String(req.nextauth.token?.role || "");
    const path = req.nextUrl.pathname;
    if (role === "purchaser" && path !== "/" && !path.startsWith("/api/purchases")) {
      return NextResponse.json({ error: "Acesso restrito à seção de compras" }, { status: 403 });
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
