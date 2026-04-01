"use client";

import * as React from "react";
import { Alert, Box, CircularProgress } from "@mui/material";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void> | void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function GoogleSignInButton({
  onCredential,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const onCredentialRef = React.useRef(onCredential);
  const onErrorRef = React.useRef(onError);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scriptError, setScriptError] = React.useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  React.useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  React.useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  React.useEffect(() => {
    if (!clientId) {
      setScriptError("Google sign-in is unavailable because NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.");
      return;
    }

    let cancelled = false;

    const initializeGoogle = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
        return;
      }

      containerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) {
            const message = "Google sign-in did not return a credential. Please try again.";
            onErrorRef.current?.(message);
            return;
          }

          setIsSubmitting(true);

          try {
            await onCredentialRef.current(response.credential);
          } catch {
            // The caller is responsible for surfacing API errors.
          } finally {
            if (!cancelled) {
              setIsSubmitting(false);
            }
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {});
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return () => {
        cancelled = true;
      };
    }

    const handleLoad = () => {
      setScriptError("");
      initializeGoogle();
    };

    const handleError = () => {
      const message = "Google sign-in could not be loaded. Please try again later.";
      setScriptError(message);
      onErrorRef.current?.(message);
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);

      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [clientId]);

  return (
    <Box sx={{ width: "100%" }}>
      {scriptError ? <Alert severity="warning" sx={{ mb: 2 }}>{scriptError}</Alert> : null}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          opacity: disabled || isSubmitting ? 0.7 : 1,
          pointerEvents: disabled || isSubmitting ? "none" : "auto",
          minHeight: 44,
        }}
      >
        <Box ref={containerRef} sx={{ width: "100%", display: "flex", justifyContent: "center" }} />
        {isSubmitting ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: 999,
            }}
          >
            <CircularProgress size={22} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
