/**
 * Server-side utility functions
 */

/**
 * Verifies a Cloudflare Turnstile token
 * @param token - The Turnstile token to verify
 * @param secret - The Turnstile secret key
 * @param remoteIp - Optional remote IP address
 * @param allowedHostnames - Optional array of allowed hostnames
 * @returns True if the token is valid, false otherwise
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string,
  allowedHostnames: string[] = []
): Promise<boolean> {
  if (!secret) {
    console.error("Turnstile secret not configured");
    return false;
  }

  const params = new URLSearchParams();
  params.append("secret", secret);
  params.append("response", token);
  if (remoteIp) params.append("remoteip", remoteIp);

  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data: any = await resp.json();
    const ok = data && data.success === true;
    if (!ok) return false;

    // If configured, enforce expected hostname(s) returned by Turnstile
    if (allowedHostnames.length > 0) {
      const hostname = data.hostname;
      if (!hostname || !allowedHostnames.includes(hostname)) {
        console.warn("Turnstile token hostname mismatch:", hostname, "not in", allowedHostnames);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}

/**
 * Validates that a value is a boolean or a string that can be converted to a boolean
 * @param value - The value to check
 * @returns True if the value is truthy (true, "true", "1", etc.)
 */
export function isFeatureEnabled(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}
