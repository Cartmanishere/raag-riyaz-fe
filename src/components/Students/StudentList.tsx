"use client";

import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
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
import { adminUsersApi } from "@/services/api";
import { ApiError, User } from "@/types";
import StudentFormDrawer, { StudentFormValues } from "./StudentFormDrawer";
import StudentRow from "./StudentRow";

const ADMIN_ROLE = "admin";
const USER_ROLE = "user";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

export default function StudentList() {
  const [students, setStudents] = React.useState<User[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<"add" | "edit">("add");
  const [selectedStudent, setSelectedStudent] = React.useState<User | undefined>();
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

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

  const handleOpenAdd = () => {
    setDrawerMode("add");
    setSelectedStudent(undefined);
    setSubmitError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (student: User) => {
    setDrawerMode("edit");
    setSelectedStudent(student);
    setSubmitError(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    if (isSaving) {
      return;
    }

    setIsDrawerOpen(false);
    setSelectedStudent(undefined);
    setSubmitError(null);
  };

  const handleSave = async (values: StudentFormValues) => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      if (drawerMode === "add") {
        const createdStudent = await adminUsersApi.create({
          email: values.email,
          password: values.password,
          status: values.status,
          role: USER_ROLE,
          displayName: values.displayName,
          phone: values.phone || null,
        });

        setStudents((current) => [createdStudent, ...current]);
      } else if (selectedStudent) {
        const updatedStudent = await adminUsersApi.update(selectedStudent.id, {
          email: values.email,
          status: values.status,
          role: selectedStudent.role || USER_ROLE,
          displayName: values.displayName,
          phone: values.phone || null,
          ...(values.password ? { password: values.password } : {}),
        });

        setStudents((current) =>
          current.map((student) =>
            student.id === updatedStudent.id ? updatedStudent : student
          )
        );
        setSelectedStudent(updatedStudent);
      }

      setIsDrawerOpen(false);
      setSubmitError(null);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(
        toErrorMessage(
          apiError,
          drawerMode === "add"
            ? "Failed to create student."
            : "Failed to update student."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

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

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add Student
        </Button>
      </Box>

      <TextField
        placeholder="Search by name, email, or phone..."
        size="small"
        fullWidth
        value={search}
        onChange={(event) => setSearch(event.target.value)}
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
            <StudentRow
              key={student.id}
              student={student}
              onEdit={handleOpenEdit}
            />
          ))
        )}
      </Paper>

      <StudentFormDrawer
        open={isDrawerOpen}
        mode={drawerMode}
        student={selectedStudent}
        isSaving={isSaving}
        submitError={submitError}
        onClose={handleCloseDrawer}
        onSave={(values) => {
          void handleSave(values);
        }}
      />
    </Box>
  );
}
