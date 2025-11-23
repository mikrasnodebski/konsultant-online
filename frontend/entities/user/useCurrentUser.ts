"use client";

import { useEffect, useState } from "react";
import { api } from "../api";

export type CurrentUser = {
	id: number | null;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	role: "CONSULTANT" | "CLIENT";
} | null;

export function useCurrentUser(): CurrentUser {
	const [user, setUser] = useState<CurrentUser>(null);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await api.get<{ user: { id: number; email: string; firstName?: string | null; lastName?: string | null; role: "CONSULTANT" | "CLIENT" } }>(
					"/auth/me"
				);
				if (!cancelled) {
					setUser({
						id: res.data.user.id,
						email: res.data.user.email,
						firstName: res.data.user.firstName ?? null,
						lastName: res.data.user.lastName ?? null,
						role: res.data.user.role,
					});
				}
			} catch {
				if (!cancelled) setUser(null);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);
	return user;
}


