"use client";

import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { adminUsersApi } from "@/services/api";
import { ApiError, User } from "@/types";
import StudentRow from "./StudentRow";

const ADMIN_ROLE = "admin";

export default function StudentList() {
  const [students, setStudents] = React.useState<User[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);

  const loadStudents = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const users = await adminUsersApi.list();
      setStudents(users.filter((user) => user.role !== ADMIN_ROLE));
    } catch (err) {
      const apiError = err as ApiError;
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load students.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = students.filter((student) => {
    if (!normalizedSearch) {
      return true;
    }

    return [student.displayName ?? "", student.email, student.phone ?? ""].some(
      (value) => value.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Students Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Browse organization users with admin accounts excluded
          </Typography>
        </Box>
      </Box>

      <TextField
        placeholder="Search by name, email, or phone..."
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
            </InputAdornment>
          ),
        }}
      />

      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading students...
            </Typography>
          </Box>
        ) : error ? (
          <Stack spacing={1} sx={{ py: 6, px: 3, textAlign: "center" }}>
            <Typography variant="body2" fontWeight={600}>
              Unable to load students
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error.message}
            </Typography>
            <Box sx={{ pt: 1 }}>
              <Button variant="outlined" onClick={() => void loadStudents()}>
                Retry
              </Button>
            </Box>
          </Stack>
        ) : students.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", px: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No non-admin users were found for this organization.
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", px: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No students match your current search.
            </Typography>
          </Box>
        ) : (
          filtered.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))
        )}
      </Paper>
    </Box>
  );
}
