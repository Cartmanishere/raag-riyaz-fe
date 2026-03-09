"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/components/Auth/AuthProvider";

export default function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);

    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="outlined"
      color="error"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      disabled={isSubmitting}
      fullWidth
    >
      Log out
    </Button>
  );
}
