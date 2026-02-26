import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { config } from "../config";
import { getItem, setItem, deleteItem } from "./secureStore";
import { Toast } from "toastify-react-native";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: config.SERVER_URL,
});

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (newToken: string) => void) => {
  console.info("[Auth] Request paused and queued waiting for new token");
  refreshSubscribers.push(cb);
};

const onRefreshed = (newToken: string) => {
  console.info(
    `[Auth] Processing ${refreshSubscribers.length} queued requests with new token`,
  );
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const refreshToken = async (): Promise<string> => {
  console.info("[Auth] Starting token refresh process...");
  const storedRefreshToken = getItem("refreshToken");

  try {
    const res = await axios.post(
      `${config.SERVER_URL}/auth/refreshAccessToken`,
      {
        refreshToken: storedRefreshToken,
      },
    );

    if (res.status !== 201 && res.status !== 200) {
      throw Error("Access Token generation failed due to invalid status");
    }

    setItem("refreshToken", res.data.data.refreshToken);
    setItem("accessToken", res.data.data.accessToken);

    console.info("[Auth] Token refresh successful");
    return res.data.accessToken;
  } catch (error: any) {
    console.error(
      "[Auth] Error during token refresh. Clearing storage.",
      error.message,
    );

    Toast.error(error.message);

    deleteItem("accessToken");
    deleteItem("refreshToken");
    throw error;
  }
};

api.interceptors.request.use(
  function (config) {
    console.debug(
      `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
    );
    const accessToken = getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  function (error: AxiosError) {
    console.error(`[API Request Error] ${error.config?.url} \n`, error.message);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.debug(`[API Response] ${response.status} ${response.config.url}`);
    return response.data.data ?? response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    console.warn(
      `[API Response Error] ${error.response?.status} for ${originalRequest.url}`,
    );

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(
        `[Auth] 401 Unauthorized caught for ${originalRequest.url}. Initiating retry sequence.`,
      );
      originalRequest._retry = true;

      if (isRefreshing) {
        console.info(
          `[Auth] Refresh already in progress. Queuing ${originalRequest.url}`,
        );
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      console.info("[Auth] No active refresh found. Triggering refresh flow.");
      isRefreshing = true;
      try {
        const newAccessToken = await refreshToken();
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        onRefreshed(newAccessToken);

        console.info(
          `[Auth] Retrying original request: ${originalRequest.url}`,
        );

        return api(originalRequest);
      } catch (refreshError) {
        console.error(
          "[Auth] Refresh flow failed. Dropping all queued requests.",
        );
        isRefreshing = false;
        refreshSubscribers = [];

        Toast.error("Something went wrong");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);


export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    api.get<any, T>(url, config),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    api.post<any, T>(url, data, config),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    api.put<any, T>(url, data, config),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    api.patch<any, T>(url, data, config),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    api.delete<any, T>(url, config),
    
  request: <T>(config: AxiosRequestConfig) => 
    api<any, T>(config),
};