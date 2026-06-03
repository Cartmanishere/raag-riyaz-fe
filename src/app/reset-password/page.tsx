"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ApiError } from "@/types";
import { authApi } from "@/services/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "Reset token is missing. Please use the link from your email.",
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.resetPassword({ token, password });
      setSubmitted(true);
    } catch (caughtError) {
      const apiError = caughtError as ApiError;
      setError(
        apiError.message ||
          "Unable to reset your password. The link may have expired.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !submitted) {
    return (
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
              Invalid reset link
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This link is missing the reset token. Please request a new password
              reset link.
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 2 }}>
            {error ||
              "No reset token found. Please use the link from your email."}
          </Alert>

          <Button
            component={Link}
            href="/forgot-password"
            fullWidth
            variant="contained"
            size="large"
            sx={{ py: 1.25, fontSize: "1rem", mb: 1.5 }}
          >
            Request new reset link
          </Button>

          <Button
            component={Link}
            href="/login"
            fullWidth
            variant="text"
            sx={{ color: "text.secondary" }}
          >
            Back to login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
            Set new password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {submitted
              ? "Your password has been reset successfully."
              : "Choose a new password for your account."}
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
              Password reset complete!
            </Alert>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              fullWidth
              sx={{ py: 1.25, fontSize: "1rem" }}
            >
              Go to login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="New password"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              required
              autoFocus
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

            <TextField
              fullWidth
              label="Confirm new password"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2 }}
              required
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
                "Reset password"
              )}
            </Button>

            <Button
              component={Link}
              href="/login"
              fullWidth
              variant="text"
              sx={{ color: "text.secondary" }}
            >
              Back to login
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
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
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </Box>
  );
}
