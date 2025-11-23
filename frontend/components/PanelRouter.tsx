"use client";

import { useCurrentUser } from "@/entities/user/useCurrentUser";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PanelRouter() {
	const user = useCurrentUser();
	const router = useRouter();

	useEffect(() => {
		if (!user) return;
		if (user.role === "CONSULTANT") router.replace("/panel/consultant");
		else router.replace("/panel/client");
	}, [user, router]);

	return (
		<div className="min-h-screen grid place-items-center">
			<p>Ładowanie profilu...</p>
		</div>
	);
}


