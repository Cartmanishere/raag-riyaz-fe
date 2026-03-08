"use client";

import { useRouter } from "next/navigation";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: clear auth tokens / session here
    router.push("/login");
  };

  return (
    <Button
      variant="outlined"
      color="error"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      fullWidth
    >
      Log out
    </Button>
  );
}
