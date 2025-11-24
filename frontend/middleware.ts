import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");

export async function middleware(req: NextRequest) {
	const token = req.cookies.get("auth_token")?.value;
	const url = req.nextUrl;

	if (url.pathname.startsWith("/panel")) {
		if (!token) {
			const loginUrl = new URL("/login", req.url);
			return NextResponse.redirect(loginUrl);
		}
		try {
			await jwtVerify(token, secret);
			return NextResponse.next();
		} catch {
			const loginUrl = new URL("/login", req.url);
			return NextResponse.redirect(loginUrl);
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/panel/:path*"],
};


