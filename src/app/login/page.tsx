"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ApiError } from "@/types";
import { useAuth } from "@/components/Auth/AuthProvider";
import GoogleSignInButton from "@/components/Auth/GoogleSignInButton";
import { getGoogleAuthErrorMessage } from "@/services/auth-errors";
import { getDefaultRouteForRole } from "@/services/auth";
import { organizationApi } from "@/services/api";
import {
  getBaseUrl,
  getOrgSlugFromHostname,
  getSubdomainUrl,
} from "@/lib/domain";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithPassword, onboarding, session, status } =
    useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [error, setError] = React.useState("");

  const [orgSlug, setOrgSlug] = React.useState<string | null>(null);
  const [orgName, setOrgName] = React.useState<string | null>(null);
  const [orgInput, setOrgInput] = React.useState("");
  const [orgError, setOrgError] = React.useState("");
  const [isResolvingOrg, setIsResolvingOrg] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function resolveOrg() {
      const slugFromHost = getOrgSlugFromHostname();

      if (!slugFromHost) {
        if (!cancelled) {
          setIsResolvingOrg(false);
        }
        return;
      }

      try {
        const org = await organizationApi.getBySlug(slugFromHost);
        if (!cancelled) {
          setOrgSlug(org.slug);
          setOrgName(org.name);
        }
      } catch (resolveError) {
        console.error(
          `Organization "${slugFromHost}" not found — redirecting to base domain.`,
          resolveError,
        );

        if (!cancelled) {
          window.location.href = getBaseUrl() + window.location.pathname;
        }
      } finally {
        if (!cancelled) {
          setIsResolvingOrg(false);
        }
      }
    }

    void resolveOrg();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (session) {
      router.replace(getDefaultRouteForRole(session.actor.role));
      return;
    }

    if (onboarding) {
      router.replace("/onboarding");
    }
  }, [onboarding, router, session]);

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = orgInput.trim();
    if (!trimmed) {
      setOrgError("Please enter an organization name.");
      return;
    }

    setOrgError("");
    setIsResolvingOrg(true);

    try {
      const org = await organizationApi.getBySlug(trimmed);
      window.location.href = getSubdomainUrl(org.slug);
    } catch (orgSubmitError) {
      console.error("Organization lookup failed:", orgSubmitError);
      setOrgError(
        `Could not find organization "${trimmed}". Please check the name and try again.`,
      );
    } finally {
      setIsResolvingOrg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await loginWithPassword({
        ...form,
        orgSlug: orgSlug!,
      });
      router.replace(getDefaultRouteForRole(session.actor.role));
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(apiError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError("");
    setIsGoogleSubmitting(true);

    try {
      const result = await loginWithGoogle({
        idToken: credential,
        orgSlug: orgSlug!,
      });

      if (result.status === "authenticated") {
        router.replace(getDefaultRouteForRole(result.session.actor.role));
        return;
      }

      router.replace("/onboarding");
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(getGoogleAuthErrorMessage(apiError));
      throw caughtError;
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (status === "loading" || session || onboarding) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isResolvingOrg && !orgSlug && !orgError) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const needsOrgInput = !orgSlug;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {orgName || "Raag Riyaz"}
            </Typography>
            {!orgName ? (
              <Typography variant="body2" color="text.secondary">
                Your companion for structured raga practice.
              </Typography>
            ) : null}
          </Box>

          {orgError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {orgError}
            </Alert>
          ) : null}

          {needsOrgInput ? (
            <Box component="form" onSubmit={handleOrgSubmit} noValidate>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your organization name to continue.
              </Typography>

              <TextField
                fullWidth
                label="Organization name"
                variant="outlined"
                value={orgInput}
                onChange={(e) => setOrgInput(e.target.value)}
                sx={{ mb: 2 }}
                autoFocus
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isResolvingOrg}
                sx={{ py: 1.25, fontSize: "1rem" }}
              >
                {isResolvingOrg ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Continue"
                )}
              </Button>
            </Box>
          ) : orgSlug ? (
            <>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  mb: 2,
                  backgroundColor: "#f5e8d8",
                  border: "1px solid #ddd0bb",
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                }}
              >
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onError={setError}
                  disabled={isSubmitting || isGoogleSubmitting}
                />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  or continue with email
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  fullWidth
                  label="Password"
                  variant="outlined"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  sx={{ mb: 1 }}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: "right", mb: 2 }}>
                  <Link
                    href="/forgot-password"
                    style={{
                      fontSize: "0.875rem",
                      color: "#807060",
                      textDecoration: "underline",
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ py: 1.25, fontSize: "1rem" }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Log in"
                  )}
                </Button>
              </Box>
            </>
          ) : null}
        </CardContent>
      </Card>
    </Box>
  );
}
