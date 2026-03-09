"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";

interface ClientRedirectProps {
  href: string;
}

export default function ClientRedirect({ href }: ClientRedirectProps) {
  const router = useRouter();

  React.useEffect(() => {
    router.replace(href);
  }, [href, router]);

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
