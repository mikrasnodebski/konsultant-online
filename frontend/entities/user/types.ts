export type RoleApi = "CONSULTANT" | "CLIENT";

export interface RegisterRequest {
	role: RoleApi;
	firstName: string;
	lastName: string;
	email: string;
  phone: string;
	password: string;
  storeSlug?: string;
}

export interface UserDto {
	id: number;
	email: string;
  phone: string;
	firstName: string;
	lastName: string;
	role: RoleApi;
}

export interface RegisterResponse {
	user: UserDto;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface LoginResponse {
	user: UserDto;
	token: string;
}


