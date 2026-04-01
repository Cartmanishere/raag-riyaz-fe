"use client";

import * as React from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithPassword, onboarding, session, status } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (session) {
      router.replace(getDefaultRouteForRole(session.actor.role));
      return;
    }

    if (onboarding) {
      router.replace("/onboarding");
    }
  }, [onboarding, router, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await loginWithPassword(form);
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
      const result = await loginWithGoogle({ idToken: credential });

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
        <CardContent sx={{ p: 4 }}>
          {/* Logo + title */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <MusicNoteIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Raag Riyaz
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your companion for structured raga practice.
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={setError}
              disabled={isSubmitting || isGoogleSubmitting}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
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
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
              Password reset is not available in this frontend yet.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.25, fontSize: "1rem" }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Log in"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
