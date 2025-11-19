export interface CreateRequestPayload {
  requestorEmail: string;
  description: string;
  reference?: string;
  retentionType: "view" | "time";
  retentionValue: number;
  // Cloudflare Turnstile token obtained from the client widget
  turnstileToken?: string;
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
  // Cloudflare Turnstile token obtained from the client widget
  turnstileToken?: string;
}

export interface RetrieveSecretResponse {
  secret: string;
  viewsRemaining?: number;
}

export interface AppMetadata {
  captchaEnabled: boolean;
  turnstileSiteKey?: string;
}

const getApiBaseUrl = () => {
  // Ensure we are in a browser environment (though implied by the prompt)
  if (typeof window !== "undefined" && window.location) {
    const { hostname } = window.location;
    
    // 1. Specific Localhost Fallback (for development)
    // If the browser is viewing http://localhost, use the specific backend port 3001
    if (hostname === 'localhost') {
      return "http://localhost:3001/api";
    }

    // 2. Production/Other Host Fallback
    // For all other hosts (e.g., staging.app.com, prod.app.com), 
    // use the current host's root (including protocol/port) and append /api
    return `${window.location.origin}/api`;
  } 
}

const API_BASE_URL = getApiBaseUrl();
export const api = {
  async getMetadata(): Promise<AppMetadata> {
    const response = await fetch(`${API_BASE_URL}/config/metadata`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch app metadata');
    }
    return response.json();
  },
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
