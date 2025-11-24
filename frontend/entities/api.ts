import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
});

function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(new RegExp("(^|; )" + name.replace(/([.$?*|{}()\\[\\]\\\\/+^])/g, "\\$1") + "=([^;]*)"));
	return match ? decodeURIComponent(match[2]) : null;
}

// Dołącz token z ciasteczka do nagłówka Authorization
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


