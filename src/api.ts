export interface CreateRequestPayload {
  requestorEmail: string;
  description: string;
  reference?: string;
  retentionType: "view" | "time";
  retentionValue: number;
}

export interface RequestResponse {
  requestId: string;
  shareableUrl: string;
  retrievalUrl: string;
}

export interface RequestDetailsResponse {
  requestId: string;
  description: string;
  status: "pending" | "submitted";
  retentionType: "view" | "time";
  retentionValue: number;
}

export interface SubmitSecretPayload {
  submitterEmail: string;
  password: string;
  confirmPassword: string;
  secret: string;
}

export interface SubmitSecretResponse {
  message: string;
  retrievalUrl: string;
}

export interface RetrieveSecretPayload {
  password: string;
}

export interface RetrieveSecretResponse {
  secret: string;
  viewsRemaining?: number;
}

const API_BASE_URL =
  (typeof process !== "undefined" &&
    (process.env.VITE_API_URL || process.env.API_BASE_URL)) ||
  (typeof (globalThis as any).importMetaEnv !== "undefined" &&
    (globalThis as any).importMetaEnv?.VITE_API_URL) ||
  "http://localhost:3001/api";

export const api = {
  async createRequest(payload: CreateRequestPayload): Promise<RequestResponse> {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create request");
    }

    return response.json();
  },

  async getRequest(requestId: string): Promise<RequestDetailsResponse> {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch request");
    }

    return response.json();
  },

  async submitSecret(
    requestId: string,
    payload: SubmitSecretPayload
  ): Promise<SubmitSecretResponse> {
    const response = await fetch(
      `${API_BASE_URL}/requests/${requestId}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit secret");
    }

    return response.json();
  },

  async retrieveSecret(
    retrievalId: string,
    payload: RetrieveSecretPayload
  ): Promise<RetrieveSecretResponse> {
    const response = await fetch(`${API_BASE_URL}/secrets/${retrievalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to retrieve secret");
    }

    return response.json();
  },
};
