"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { teachers, students } from "@/data/seed";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({ username: "", password: "" });
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const teacher = teachers.find(
      (t) => t.username === form.username && t.password === form.password
    );
    if (teacher) return router.push("/teacher-dashboard/students");

    const student = students.find(
      (s) => s.username === form.username && s.password === form.password
    );
    if (student) return router.push("/");

    setError("Invalid username or password.");
  };

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

          {/* Login form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
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

            {/* Forgot password */}
            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Link
                href="/forgot-password"
                underline="hover"
                variant="body2"
                sx={{ color: "primary.main", cursor: "pointer" }}
              >
                Forgot password?
              </Link>
            </Box>

            {error && (
              <Typography
                variant="body2"
                color="error"
                sx={{ mb: 2, textAlign: "center" }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ py: 1.25, fontSize: "1rem" }}
            >
              Log in
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
