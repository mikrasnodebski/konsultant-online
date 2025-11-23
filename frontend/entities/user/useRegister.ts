"use client";

import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { api } from "../api";
import type { RegisterRequest, RegisterResponse } from "./types";

export function useRegister(
	options?: UseMutationOptions<RegisterResponse, Error, RegisterRequest>
) {
	return useMutation<RegisterResponse, Error, RegisterRequest>({
		mutationFn: async (body) => {
			const res = await api.post<RegisterResponse>("/auth/register", body);
			return res.data;
		},
		...options,
	});
}


