import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
});

function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const parts = document.cookie.split("; ").filter(Boolean);
	const pair = parts.find((p) => p.startsWith(name + "="));
	if (!pair) return null;
	const value = pair.slice(name.length + 1);
	return value ? decodeURIComponent(value) : null;
}

api.interceptors.request.use((config) => {
	try {
		const token = getCookie("auth_token");
		if (token) {
			config.headers = config.headers ?? {};
			config.headers["Authorization"] = `Bearer ${token}`;
		} else if (config?.headers && "Authorization" in config.headers) {
			delete (config.headers as any)["Authorization"];
		}
	} catch {}
	return config;
});

api.interceptors.response.use(
	(response: any) => response,
	(error: any) => {
		const message =
			error?.response?.data?.message ||
			error?.response?.data ||
			error?.message ||
			"Request failed";
		return Promise.reject(new Error(message));
	}
);


