import axios, { AxiosError, AxiosInstance } from 'axios';
import {
    Channels,
    FastalertError,
    FastalertmasterApiError,
    FastalertResponse,
    Messages,
} from './types.js';

export class FastalertClient {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly client: AxiosInstance;

    constructor(apiKey: string) {
        if (!apiKey) throw new Error('API key is required');

        this.apiKey = apiKey;
        this.baseUrl = process.env.BASE_URL || 'https://apialert.testflight.biz/api/v1';

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-API-KEY': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Generic request handler
     */
    private async request<T>(method: 'get' | 'post', url: string, data?: any, params?: any): Promise<T> {
        try {
            const response = await this.client.request<FastalertResponse>({
                method,
                url,
                data,
                params,
            });

            return (response.data?.data as T) || ([] as T);
        } catch (error) {
            if (axios.isAxiosError(error)) {

                const axiosError = error as AxiosError<FastalertError>;
                const status = axiosError.response?.status;
                const data = axiosError.response?.data;

                if (status === 422) {
                    const validationErrors =
                        (data as any)?.errors ||
                        (data as any)?.fault?.detail ||
                        (data as any)?.message ||
                        'Validation error occurred';

                    let messageText = 'Validation Error: ';
                    if (typeof validationErrors === 'object') {
                        messageText += JSON.stringify(validationErrors, null, 2);
                    } else {
                        messageText += validationErrors;
                    }

                    throw new FastalertmasterApiError(
                        messageText,
                        'VALIDATION_ERROR',
                        422
                    );
                }

                const apiError = axiosError.response?.data?.fault;
                throw new FastalertmasterApiError(
                    apiError?.faultstring || 'API request failed',
                    apiError?.detail?.errorcode,
                    status
                );
            }
            throw error;
        }

    }

    /**
    * Search for channels optiona search by name
    * @param query Search query parameters
    * @returns Array of matching channels
    */
    async searchChannelEvents<T extends Channels = Channels>(query: { name?: string } = {}): Promise<T[]> {
        return this.request<T[]>('get', '/organization/channels', undefined, query);
    }

    /**
     * Send a message to channels
     * @param message Message payload
     * @returns Array of sent messages
     */
    async sendMessageEvents(message: Messages): Promise<Messages[]> {
        return this.request<Messages[]>('post', '/send-message', message);
    }
}
