import apiClient, { type ApiResponse } from "./api.client";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[];
    permissions: string[];
  };
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = (await apiClient.post("/auth/login", {
      email,
      password,
    })) as unknown as ApiResponse<LoginResponse>;
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyId: string;
  }) => {
    const response = (await apiClient.post("/auth/register", data)) as unknown as ApiResponse<unknown>;
    return response.data;
  },

  logout: async () => {
    await apiClient.post("/auth/logout");
  },

  getProfile: async () => {
    const response = (await apiClient.get("/auth/profile")) as unknown as ApiResponse<
      LoginResponse["user"]
    >;
    return response.data;
  },
};
