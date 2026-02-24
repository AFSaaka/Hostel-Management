//src/middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// We use the NextAuthMiddleware type indirectly by wrapping the function
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Protect Admin Management
  if (nextUrl.pathname.startsWith("/dashboard/admin-management")) {
    const role = req.auth?.user?.role;
    if (role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Protect Dashboard
  if (!isLoggedIn && nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};