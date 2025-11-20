import { useState, useEffect, useRef } from "react";
import { api } from "../api";

/**
 * Custom hook to manage Cloudflare Turnstile CAPTCHA integration
 * Handles metadata fetching, script injection, widget rendering, and token management
 */
export function useTurnstile() {
  const [captchaEnabled, setCaptchaEnabled] = useState<boolean>(true);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileWidgetRef = useRef<HTMLDivElement | null>(null);

  // Load app metadata (including CAPTCHA config) on mount
  useEffect(() => {
    let mounted = true;
    api
      .getMetadata()
      .then((metadata) => {
        if (!mounted) return;
        setCaptchaEnabled(metadata.captchaEnabled);
        if (metadata.captchaEnabled && metadata.turnstileSiteKey) {
          setTurnstileSiteKey(metadata.turnstileSiteKey);
        }
      })
      .catch((err) => {
        console.error(
          "Failed to fetch app metadata:",
          err instanceof Error ? err.message : err
        );
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Inject Turnstile script and render the widget when siteKey available
  useEffect(() => {
    if (!turnstileSiteKey) return;

    const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    
    // If script already present, render directly
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    
    const renderWidget = () => {
      // @ts-ignore - turnstile is attached to window when script loads
      if (window.turnstile && turnstileWidgetRef.current) {
        // @ts-ignore
        window.turnstile.render(turnstileWidgetRef.current, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          "error-callback": () => setTurnstileToken(""),
        });
      }
    };

    if (existing) {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.onload = renderWidget;
    document.body.appendChild(script);

    // Cleanup function - we don't remove the script to avoid breaking other pages
    return () => {};
  }, [turnstileSiteKey]);

  return {
    captchaEnabled,
    turnstileSiteKey,
    turnstileToken,
    turnstileWidgetRef,
  };
}
