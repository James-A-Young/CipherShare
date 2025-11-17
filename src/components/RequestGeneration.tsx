import { useState } from "react";
import { api, CreateRequestPayload } from "../api";

export default function RequestGeneration() {
  const [formData, setFormData] = useState<CreateRequestPayload>({
    requestorEmail: "",
    description: "",
    retentionType: "time",
    retentionValue: 3,
  });
  const [shareableUrl, setShareableUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.createRequest(formData);
      setShareableUrl(response.shareableUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReset = () => {
    setShareableUrl("");
    setFormData({
      requestorEmail: "",
      description: "",
      retentionType: "time",
      retentionValue: 3,
    });
  };

  if (shareableUrl) {
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
              Request Created!
            </h2>
            <p className="text-gray-400">
              Share this link to collect your secret
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <label className="label mb-3">Shareable Request URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableUrl}
                readOnly
                className="input-field flex-1 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className="btn-primary whitespace-nowrap"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>

          <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300">
              💡 <strong>Next Steps:</strong> Share this URL with someone you
              trust to submit the secret. Once submitted, you'll receive a
              retrieval link via email.
            </p>
          </div>

          <button onClick={handleReset} className="btn-secondary w-full">
            Create Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔐 CipherShare</h1>
          <p className="text-gray-400">
            Create a secure request for sensitive information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requestor Email */}
          <div>
            <label htmlFor="requestorEmail" className="label">
              Your Email Address
            </label>
            <input
              id="requestorEmail"
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
              value={formData.requestorEmail}
              onChange={(e) =>
                setFormData({ ...formData, requestorEmail: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll receive the retrieval link here
            </p>
          </div>

          {/* Secret Description */}
          <div>
            <label htmlFor="description" className="label">
              What secret are you requesting?
            </label>
            <textarea
              id="description"
              required
              rows={3}
              className="input-field resize-none"
              placeholder="e.g., The WiFi password for the New York Office"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be shown to the person submitting the secret
            </p>
          </div>

          {/* Retention Policy */}
          <div>
            <label className="label mb-4">Retention Policy</label>

            {/* Retention Type */}
            <div className="space-y-4">
              <label className="flex items-center p-4 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-850 transition-colors">
                <input
                  type="radio"
                  name="retentionType"
                  value="view"
                  checked={formData.retentionType === "view"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      retentionType: "view",
                      retentionValue: 1,
                    })
                  }
                  className="w-4 h-4 text-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="text-white font-medium">View Limit</div>
                  <div className="text-sm text-gray-400">
                    Secret expires after being viewed
                  </div>
                </div>
              </label>

              {formData.retentionType === "view" && (
                <div className="ml-8 space-x-4">
                  {[1, 2].map((value) => (
                    <label key={value} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="viewLimit"
                        value={value}
                        checked={formData.retentionValue === value}
                        onChange={() =>
                          setFormData({ ...formData, retentionValue: value })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span className="ml-2 text-gray-300">
                        {value} {value === 1 ? "view" : "views"}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <label className="flex items-center p-4 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-850 transition-colors">
                <input
                  type="radio"
                  name="retentionType"
                  value="time"
                  checked={formData.retentionType === "time"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      retentionType: "time",
                      retentionValue: 3,
                    })
                  }
                  className="w-4 h-4 text-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="text-white font-medium">Time Limit</div>
                  <div className="text-sm text-gray-400">
                    Secret expires after a set number of days
                  </div>
                </div>
              </label>

              {formData.retentionType === "time" && (
                <div className="ml-8 space-x-4">
                  {[3, 5, 10].map((value) => (
                    <label key={value} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="timeLimit"
                        value={value}
                        checked={formData.retentionValue === value}
                        onChange={() =>
                          setFormData({ ...formData, retentionValue: value })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span className="ml-2 text-gray-300">{value} days</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating Request..." : "Generate Request Link"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            All data is encrypted with dual-layer encryption and automatically
            expires.
          </p>
        </div>
      </div>
    </div>
  );
}
