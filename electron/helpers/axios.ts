import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import https from "https";
import { Routes } from "../../src/interfaces";
import 'dotenv/config'

class ApiService {
  private apiClient: AxiosInstance;

  constructor(port: number, password: string) {
    const token = Buffer.from(`riot:${password}`).toString("base64");
    this.apiClient = process.env.DEV ? axios.create({
      baseURL: `http://127.0.0.1:${port}`,
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
    }) : axios.create({
      baseURL: `https://127.0.0.1:${port}`,
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    this.initializeResponseInterceptor();
  }

  private initializeResponseInterceptor() {
    this.apiClient.interceptors.response.use(
      (response: AxiosResponse) => {
        const url = response.config.url;
        switch (true) {
          case url?.includes(Routes.PLAYER):
            response.data = {
              name: response.data?.displayName || response.data?.gameName,
              accountId: response.data?.accountId,
              summonerId: response.data?.summonerId,
              level: response.data?.summonerLevel,
            };
            break;
          case url?.includes(Routes.SESSION):
            response.data = {
              gameData: {
                gameId: response.data?.gameData?.gameId,
                isCustomGame: response.data?.gameData?.isCustomGame,
                gameName: response.data?.gameData?.gameName,
                queue: {
                  description: response.data?.gameData?.queue?.description,
                  detailedDescription:
                    response.data?.gameData?.queue?.detailedDescription,
                },
                teamOne: response.data?.gameData?.teamOne ?? [],
                teamTwo: response.data?.gameData?.teamTwo ?? [],
              },
              phase: response.data?.phase,
            };
            break;

          default:
            break;
        }
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  public get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.get<T>(url, config);
  }

  public post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.apiClient.post<T>(url, data, config);
  }
}

export default ApiService;
