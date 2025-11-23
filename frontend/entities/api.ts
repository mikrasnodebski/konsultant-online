import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
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


