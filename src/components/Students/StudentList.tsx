"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { deriveActorDisplayName } from "@/services/auth-session";
import { adminUsersApi } from "@/services/api";
import { ApiError, User } from "@/types";
import StudentFormDrawer, { StudentFormValues } from "./StudentFormDrawer";

const USER_ROLE = "user";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

export default function StudentList() {
  const router = useRouter();
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
        <Box sx={{ textAlign: "center", flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Students
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add Student
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search students by name or email..."
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ flex: 1, minWidth: 200, maxWidth: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading students...
          </Typography>
        </Box>
      ) : error ? (
        <Stack spacing={1.5} sx={{ py: 6, px: 3, textAlign: "center" }}>
          <Typography variant="body2" fontWeight={600}>
            Unable to load students
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
          <Box sx={{ pt: 0.5 }}>
            <Button variant="outlined" onClick={() => void loadStudents()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : students.length === 0 ? (
        <Alert severity="info">
          No students found.
        </Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          No students match your current search.
        </Alert>
      ) : (
        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflowX: "auto",
          }}
        >
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((student) => (
                <TableRow
                  key={student.id}
                  hover
                  onClick={() =>
                    router.push(`/teacher-dashboard/students/detail?id=${student.id}`)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {deriveActorDisplayName(student)}
                    </Typography>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.phone || "—"}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {student.status || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenEdit(student);
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
