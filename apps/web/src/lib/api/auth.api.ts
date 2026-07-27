import type {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
  UserResponse,
} from "@eventure/shared";
import { fetchApi } from "./client";

export const authApi = {
  register: (data: RegisterDTO) =>
    fetchApi<UserResponse>("/auth/register", { method: "POST", data }),

  login: (data: LoginDTO) =>
    fetchApi<UserResponse>("/auth/login", { method: "POST", data }),

  logout: () => fetchApi<null>("/auth/logout", { method: "POST" }),

  forgotPassword: (data: ForgotPasswordDTO) =>
    fetchApi<null>("/auth/forgot-password", { method: "POST", data }),

  resetPassword: (data: ResetPasswordDTO) =>
    fetchApi<UserResponse>("/auth/reset-password", { method: "POST", data }),
};
