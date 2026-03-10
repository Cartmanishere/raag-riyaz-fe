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
      setStudents(users.filter((user) => user.role.toLowerCase() === USER_ROLE));
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
    <Box sx={{ px: { xs: 2, sm: "100px" } }}>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 3,
          mt: 1,
        }}
      >
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Students
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          Add Student
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ borderRadius: 2, mb: 2 }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <TextField
            placeholder="Search students by name or email..."
            size="small"
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      {/* Students list */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="subtitle2" fontWeight={600}>
            All Students ({filtered.length})
          </Typography>
        </Box>

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
          <Box sx={{ py: 8, textAlign: "center", px: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No students found
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
              Add Your First Student
            </Button>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", px: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No students match your current search.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: { xs: 1, sm: 1.5 }, display: "flex", flexDirection: "column", gap: 1 }}>
            {filtered.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onEdit={handleOpenEdit}
              />
            ))}
          </Box>
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
