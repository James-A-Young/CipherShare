import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api, SubmitSecretPayload, RequestDetailsResponse } from "../api";

export default function SecretSubmission() {
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<RequestDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [retrievalUrl, setRetrievalUrl] = useState<string>("");

  const [formData, setFormData] = useState<SubmitSecretPayload>({
    submitterEmail: "",
    password: "",
    confirmPassword: "",
    secret: "",
  });

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) {
        setError("Invalid request ID");
        setLoading(false);
        return;
      }

      try {
        const data = await api.getRequest(requestId);
        setRequest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load request");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
    const complexityMet = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length >= 3;

    if (!complexityMet) {
      setError("Password must contain at least 3 of: uppercase letter, lowercase letter, number, special character");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.submitSecret(requestId!, formData);
      setRetrievalUrl(response.retrievalUrl);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit secret");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading request...</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 bg-opacity-20 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Request Not Found
          </h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (request?.status === "submitted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Already Fulfilled
          </h2>
          <p className="text-gray-400">
            This request has already been fulfilled.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-20 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Secret Submitted!
            </h2>
            <p className="text-gray-400">The requestor has been notified</p>
          </div>

          <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-6 mb-6">
            <p className="text-green-200 mb-4">
              ✓ A unique retrieval link has been sent to the requestor's email.
            </p>
            <p className="text-sm text-green-100">
              <strong>Important:</strong> Please share your password with the
              requestor through a secure side channel (like a jira ticket, phone
              call, teams or slack message, or in person). They will need it to decrypt
              the secret.
            </p>
          </div>

          {retrievalUrl && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2">
                Retrieval URL (DO NOT SHARE THIS it is also sent via email):
              </p>
              <p className="text-xs text-blue-400 font-mono break-all">
                {retrievalUrl}
              </p>
            </div>
          )}

          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              🔒 Your secret is protected with dual-layer encryption and will
              automatically expire based on the retention policy set by the
              requestor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔐 Submit Secret
          </h1>
          <p className="text-gray-400">
            Fulfill this secure information request
          </p>
        </div>

        {/* Request Description */}
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-6 mb-8">
          <label className="label mb-2">Requested Information:</label>
          <p className="text-white text-lg font-medium">
            {request?.description}
          </p>

          <div className="mt-4 pt-4 border-t border-blue-500 border-opacity-20">
            <p className="text-sm text-blue-200">
              Retention:{" "}
              <strong>
                {request?.retentionType === "view"
                  ? `${request.retentionValue} view${
                      request.retentionValue > 1 ? "s" : ""
                    }`
                  : `${request?.retentionValue ?? 10} days`}
              </strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submitter Email */}
          <div>
            <label htmlFor="submitterEmail" className="label">
              Your Email (Optional)
            </label>
            <input
              id="submitterEmail"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={formData.submitterEmail}
              onChange={(e) =>
                setFormData({ ...formData, submitterEmail: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              For context only, not stored permanently
            </p>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">
              Create Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              placeholder="Create a strong password to protect your secret"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              <p className="font-medium">Password must have:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li className={formData.password.length >= 12 ? "text-green-400" : ""}>
                  At least 12 characters
                </li>
                <li className={(
                  [/[A-Z]/.test(formData.password), /[a-z]/.test(formData.password), 
                   /[0-9]/.test(formData.password), /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)]
                   .filter(Boolean).length >= 3
                ) ? "text-green-400" : ""}>
                  At least 3 of: uppercase, lowercase, number, special character
                </li>
              </ul>
              <p className="mt-2 text-gray-500">
                You'll share this separately with the requestor (e.g., via phone).
              </p>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="input-field"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>

          {/* Secret */}
          <div>
            <label htmlFor="secret" className="label">
              The Secret
            </label>
            <textarea
              id="secret"
              required
              rows={6}
              className="input-field resize-none font-mono"
              placeholder="Enter the sensitive information here..."
              value={formData.secret}
              onChange={(e) =>
                setFormData({ ...formData, secret: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be encrypted with your password
            </p>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Encrypting & Submitting..." : "Submit Secret"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your secret is encrypted with dual-layer encryption before
            storage
          </p>
        </div>
      </div>
    </div>
  );
}
