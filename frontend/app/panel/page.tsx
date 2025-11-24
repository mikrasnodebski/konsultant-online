import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PanelRouter } from "@/components/PanelRouter";
import { redirect } from "next/navigation";

type JwtPayload = {
	sub: number;
	email: string;
	role: "CONSULTANT" | "CLIENT";
};

async function getUserFromCookie() {
	const cookieStore = await cookies();
	const token = cookieStore.get("auth_token")?.value;
	if (!token) return null;
	const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
	try {
		const { payload } = await jwtVerify(token, secret);
		return payload as unknown as JwtPayload;
	} catch {
		return null;
	}
}

export default async function PanelPage() {
	const user = await getUserFromCookie();
	if (!user) redirect("/login");
	if (user.role === "CONSULTANT") redirect("/panel/consultant");
	if (user.role === "CLIENT") redirect("/panel/client");

	return <PanelRouter />;
}


