"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { api } from "../api";
import type { LoginRequest, LoginResponse } from "./types";

export function useLogin(
	options?: UseMutationOptions<LoginResponse, Error, LoginRequest>
) {
	return useMutation<LoginResponse, Error, LoginRequest>({
		mutationFn: async (body) => {
			const res = await api.post<LoginResponse>("/auth/login", body);
			return res.data;
		},
		onSuccess: (data, variables, ctx, mutation) => {
			// Zapisz token w ciasteczku (frontend użyje go do dodawania Authorization)
			document.cookie = `auth_token=${data.token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
			// Ustaw od razu nagłówek Authorization dla bieżącej sesji
			api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
			options?.onSuccess?.(data, variables, ctx, mutation);
		},
		...options,
	});
}


