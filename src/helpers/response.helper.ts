import { Response } from "express";

// 🔹 Generic API Response Type
interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  error: boolean;
}

// 🔹 Common Response Function
export const generalResponse = <T = any>(
  res: Response,
  data: T = {} as T,
  message: string = "Success",
  success: boolean = true,
  error: boolean = false,
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    data,
    message,
    success,
    error,
  });
};