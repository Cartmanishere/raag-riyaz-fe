"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { ApiError } from "@/types";
import { authApi, organizationApi } from "@/services/api";
import {
  getOrgSlugFromHostname,
} from "@/lib/domain";

export default function ForgotPasswordPage() {
  const [form, setForm] = React.useState({ email: "", orgSlug: "" });
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResolvingOrg, setIsResolvingOrg] = React.useState(true);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function resolveOrg() {
      const slugFromHost = getOrgSlugFromHostname();

      if (slugFromHost) {
        try {
          const org = await organizationApi.getBySlug(slugFromHost);
          if (!cancelled) {
            setForm((f) => ({ ...f, orgSlug: org.slug }));
          }
        } catch {
          // Org not found from subdomain — user will enter manually
        }
      }

      if (!cancelled) {
        setIsResolvingOrg(false);
      }
    }

    void resolveOrg();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = form.email.trim();
    const trimmedSlug = form.orgSlug.trim();

    if (!trimmedSlug) {
      setError("Please enter your organization name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.forgotPassword({
        orgSlug: trimmedSlug,
        email: trimmedEmail,
      });
      setSubmitted(true);
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(
        apiError.message || "Unable to process your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResolvingOrg) {
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
              Reset your password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {submitted
                ? "If an account exists, you will receive an email with reset instructions."
                : "Enter your email address and we'll send you a link to reset your password."}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {submitted ? (
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Reset email sent! Check your inbox.
              </Alert>
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                startIcon={<ArrowBackIcon />}
              >
                Back to login
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Organization name"
                variant="outlined"
                value={form.orgSlug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, orgSlug: e.target.value }))
                }
                sx={{ mb: 2 }}
                required
                autoFocus={!form.orgSlug}
              />

              <TextField
                fullWidth
                label="Email address"
                variant="outlined"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                sx={{ mb: 2 }}
                required
                autoFocus={!!form.orgSlug}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ py: 1.25, fontSize: "1rem", mb: 1.5 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Send reset link"
                )}
              </Button>

              <Button
                component={Link}
                href="/login"
                fullWidth
                variant="text"
                startIcon={<ArrowBackIcon />}
                sx={{ color: "text.secondary" }}
              >
                Back to login
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
