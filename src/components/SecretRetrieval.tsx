import { useState } from "react";
import { useParams } from "react-router-dom";
import { api, RetrieveSecretPayload } from "../api";
import { useTurnstile } from "../hooks/useTurnstile";

export default function SecretRetrieval() {
  const { retrievalId } = useParams<{ retrievalId: string }>();
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState<string>("");
  const [viewsRemaining, setViewsRemaining] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [retrieved, setRetrieved] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // CAPTCHA hook
  const { captchaEnabled, turnstileSiteKey, turnstileToken, turnstileWidgetRef } = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: RetrieveSecretPayload = {
        password,
        ...(captchaEnabled && { turnstileToken }),
      };
      const response = await api.retrieveSecret(retrievalId!, payload);
      setSecret(response.secret);
      setViewsRemaining(response.viewsRemaining);
      setRetrieved(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to retrieve secret");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (retrieved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="card max-w-3xl w-full">
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Secret Retrieved!
            </h2>
            {viewsRemaining !== undefined && (
              <p className="text-gray-400">
                {viewsRemaining === 0
                  ? "⚠️ This was the last view. The secret has been deleted."
                  : `${viewsRemaining} view${
                      viewsRemaining > 1 ? "s" : ""
                    } remaining`}
              </p>
            )}
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="label">Your Secret:</label>
              <button
                onClick={handleCopy}
                className="text-sm btn-secondary py-2 px-4"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
            <div className="bg-gray-950 rounded-lg p-4 border border-gray-700">
              <pre className="text-white font-mono text-sm whitespace-pre-wrap break-words">
                {secret}
              </pre>
            </div>
          </div>

          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-200">
              ⚠️ <strong>Security Notice:</strong> Make sure to copy this secret
              now. Depending on the retention policy, it may not be available
              after you close this page.
            </p>
          </div>

          {viewsRemaining === 0 && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4">
              <p className="text-sm text-red-200">
                🗑️ This secret has been permanently deleted from our servers.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="card max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            🔓 Retrieve Secret
          </h1>
          <p className="text-gray-400">
            Enter the password to decrypt your secret
          </p>
        </div>

        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-200">
            🔑 You should have received this password through a secure side
            channel (not email). The password is required to decrypt the secret.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoFocus
              className="input-field"
              placeholder="Enter the password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              This password was set by the person who submitted the secret
            </p>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
              <p className="text-red-100 text-sm">
                {error === "Invalid password" && "❌ "}
                {error === "Secret not found or expired" && "⏰ "}
                {error === "Secret has expired" && "⏰ "}
                {error}
              </p>
              {error === "Invalid password" && (
                <p className="text-red-200 text-xs mt-2">
                  Make sure you're using the password that was shared with you
                  separately.
                </p>
              )}
              {(error === "Secret not found or expired" ||
                error === "Secret has expired") && (
                <p className="text-red-200 text-xs mt-2">
                  The secret may have reached its view limit or time expiration.
                </p>
              )}
            </div>
          )}

          {/* Turnstile widget placeholder - only shown if CAPTCHA is enabled */}
          {captchaEnabled && turnstileSiteKey && (
            <div className="py-2">
              <div ref={turnstileWidgetRef} />
              {!turnstileToken && (
                <p className="text-xs text-gray-500 mt-2">
                  Please complete the CAPTCHA before retrieving.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (captchaEnabled && !turnstileToken)}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Decrypting...
              </span>
            ) : (
              "🔓 Decrypt & Retrieve Secret"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your secret is encrypted end-to-end with dual-layer encryption
          </p>
        </div>
      </div>
    </div>
  );
}
