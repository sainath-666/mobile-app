// lib/api.ts
import axios from "axios";

// If EXPO_PUBLIC_API_BASE_URL is defined, use that, else fallback (dev)
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.123:5000"; // 👈 your local IP

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});
