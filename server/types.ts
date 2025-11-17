export interface SecretRequest {
  requestId: string;
  requestorEmail: string;
  description: string;
  retentionType: "view" | "time";
  retentionValue: number; // 1-2 for views, 3-10 for days
  status: "pending" | "submitted";
  createdAt: number;
  submittedAt?: number;
}

export interface SubmittedSecret {
  retrievalId: string;
  requestId: string;
  encryptedSecret: string; // Double-encrypted: System key + User password
  passwordHash: string; // For verification
  viewsRemaining?: number;
  expiresAt: number;
  createdAt: number;
}

export interface RequestCreationResponse {
  requestId: string;
  shareableUrl: string;
}

export interface SecretSubmissionRequest {
  submitterEmail: string;
  password: string;
  confirmPassword: string;
  secret: string;
}

export interface SecretRetrievalRequest {
  password: string;
}

export interface SecretRetrievalResponse {
  secret: string;
  viewsRemaining?: number;
}
