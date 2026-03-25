"use client";

import * as React from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import StudentFormDrawer, { StudentFormValues } from "@/components/Students/StudentFormDrawer";
import { deriveActorDisplayName, deriveActorInitials } from "@/services/auth-session";
import { adminRecordingsApi, adminUsersApi } from "@/services/api";
import { AdminUserRecordingAssignment, ApiError, StudentBatch, User } from "@/types";

const USER_ROLE = "user";

function formatStatus(status: string) {
  if (!status.trim()) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function isNotFoundError(error: ApiError | null) {
  return error?.statusCode === 404;
}

function isStudentUser(user: User) {
  return user.role.toLowerCase() === USER_ROLE;
}

function formatAssignedAt(value: string) {
  const assignedAt = new Date(value);

  if (Number.isNaN(assignedAt.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(assignedAt);
}

interface StudentDetailPageClientProps {
  id: string;
}

export default function StudentDetailPageClient({
  id,
}: StudentDetailPageClientProps) {
  const [activeTab, setActiveTab] = React.useState<"recordings" | "batches">("recordings");
  const [student, setStudent] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [assignedRecordings, setAssignedRecordings] = React.useState<
    AdminUserRecordingAssignment[]
  >([]);
  const [areRecordingsLoading, setAreRecordingsLoading] = React.useState(true);
  const [recordingsError, setRecordingsError] = React.useState<ApiError | null>(null);
  const [unassigningAssignmentId, setUnassigningAssignmentId] = React.useState<string | null>(null);
  const [unassignError, setUnassignError] = React.useState<string | null>(null);
  const [batches, setBatches] = React.useState<StudentBatch[]>([]);
  const [areBatchesLoading, setAreBatchesLoading] = React.useState(true);
  const [batchesError, setBatchesError] = React.useState<ApiError | null>(null);

  const loadStudent = React.useCallback(async () => {
    if (!id.trim()) {
      setError({
        message: "Invalid student ID.",
        statusCode: 404,
      });
      setStudent(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextStudent = await adminUsersApi.getById(id);
      if (!isStudentUser(nextStudent)) {
        setStudent(null);
        setError({
          message: "The requested account is not a student.",
          statusCode: 404,
        });
        return;
      }

      setStudent(nextStudent);
    } catch (err) {
      const apiError = err as ApiError;
      setStudent(null);
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load student.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  const loadAssignedRecordings = React.useCallback(async () => {
    if (!id.trim()) {
      setAssignedRecordings([]);
      setRecordingsError({
        message: "Invalid student ID.",
        statusCode: 404,
      });
      setAreRecordingsLoading(false);
      return;
    }

    setAreRecordingsLoading(true);
    setRecordingsError(null);
    setUnassignError(null);

    try {
      const nextAssignedRecordings = await adminUsersApi.listRecordings(id);
      setAssignedRecordings(nextAssignedRecordings);
    } catch (err) {
      const apiError = err as ApiError;
      setAssignedRecordings([]);
      setRecordingsError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load assigned recordings.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setAreRecordingsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadAssignedRecordings();
  }, [loadAssignedRecordings]);

  const loadStudentBatches = React.useCallback(async () => {
    if (!id.trim()) {
      setBatches([]);
      setBatchesError({
        message: "Invalid student ID.",
        statusCode: 404,
      });
      setAreBatchesLoading(false);
      return;
    }

    setAreBatchesLoading(true);
    setBatchesError(null);

    try {
      const nextBatches = await adminUsersApi.listStudentBatches(id);
      setBatches(nextBatches);
    } catch (err) {
      const apiError = err as ApiError;
      setBatches([]);
      setBatchesError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load student batches.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setAreBatchesLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadStudentBatches();
  }, [loadStudentBatches]);

  const handleUnassign = async (assignment: AdminUserRecordingAssignment) => {
    setUnassigningAssignmentId(assignment.assignmentId);
    setUnassignError(null);

    try {
      await adminRecordingsApi.unassign(assignment.recording.id, assignment.assignedToUserId);
      setAssignedRecordings((current) =>
        current.filter((item) => item.assignmentId !== assignment.assignmentId)
      );
    } catch (err) {
      const apiError = err as ApiError;
      setUnassignError(apiError?.message ?? "Failed to unassign recording.");
    } finally {
      setUnassigningAssignmentId(null);
    }
  };

  const handleSave = async (values: StudentFormValues) => {
    if (!student) {
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      const updatedStudent = await adminUsersApi.update(student.id, {
        email: values.email,
        status: values.status,
        role: student.role || USER_ROLE,
        displayName: values.displayName,
        phone: values.phone || null,
        ...(values.password ? { password: values.password } : {}),
      });

      setStudent(updatedStudent);
      setIsDrawerOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError?.message ?? "Failed to update student.");
    } finally {
      setIsSaving(false);
    }
  };

  const backLink = (
    <Link href="/teacher-dashboard/students" style={{ textDecoration: "none" }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
          "&:hover": { color: "primary.main" },
        }}
      >
        <ArrowBackIcon fontSize="small" />
        <Typography variant="body2">Back to Students</Typography>
      </Box>
    </Link>
  );

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading student details...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error && isNotFoundError(error)) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 6 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={700}>
                Student not found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error.message}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 6 }}>
            <Stack spacing={2}>
              <Alert severity="error">
                {error?.message ?? "Unable to load this student."}
              </Alert>
              <Box>
                <Button variant="outlined" onClick={() => void loadStudent()}>
                  Retry
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const displayName = deriveActorDisplayName(student);
  const initials = deriveActorInitials(student);
  const statusColor =
    student.status.toLowerCase() === "active" ? "success.main" : "text.disabled";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>{backLink}</Box>

      <Card sx={{ mb: 3 }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 3,
            p: 3,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 64,
              height: 64,
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75, flexWrap: "wrap" }}>
              <Typography variant="h5" fontWeight={700}>
                {displayName}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: statusColor,
                  }}
                />
                <Typography variant="caption" color={statusColor} fontWeight={500}>
                  {formatStatus(student.status)}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={0.75}>
              <Typography variant="body2" color="text.secondary">
                {student.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.phone?.trim() ? student.phone : "No phone number provided"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Role: {student.role}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                User ID: {student.id}
              </Typography>
            </Stack>
          </Box>

          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => {
              setSubmitError(null);
              setIsDrawerOpen(true);
            }}
          >
            Edit Student
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_event, value: "recordings" | "batches") => setActiveTab(value)}
            >
              <Tab label={`Recordings (${assignedRecordings.length})`} value="recordings" />
              <Tab label={`Batches (${batches.length})`} value="batches" />
            </Tabs>
          </Box>

          {activeTab === "recordings" ? (
            <>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Recordings
              </Typography>
              {areRecordingsLoading ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading assigned recordings...
                  </Typography>
                </Box>
              ) : recordingsError ? (
                <Stack spacing={1.5} sx={{ pt: 1 }}>
                  <Alert severity="error">{recordingsError.message}</Alert>
                  <Box>
                    <Button variant="outlined" onClick={() => void loadAssignedRecordings()}>
                      Retry
                    </Button>
                  </Box>
                </Stack>
              ) : assignedRecordings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recordings have been assigned to this student yet.
                </Typography>
              ) : (
                <Box sx={{ pt: 1 }}>
                  {unassignError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {unassignError}
                    </Alert>
                  ) : null}
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
                          <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Assigned</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignedRecordings.map((assignment) => (
                          <TableRow key={assignment.assignmentId} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {assignment.recording.title}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatAssignedAt(assignment.assignedAt)}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                color="error"
                                variant="text"
                                onClick={() => {
                                  void handleUnassign(assignment);
                                }}
                                disabled={unassigningAssignmentId === assignment.assignmentId}
                              >
                                {unassigningAssignmentId === assignment.assignmentId
                                  ? "Unassigning..."
                                  : "Unassign"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          ) : (
            <>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Batches
              </Typography>
              {areBatchesLoading ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading student batches...
                  </Typography>
                </Box>
              ) : batchesError ? (
                <Stack spacing={1.5} sx={{ pt: 1 }}>
                  <Alert severity="error">{batchesError.message}</Alert>
                  <Box>
                    <Button variant="outlined" onClick={() => void loadStudentBatches()}>
                      Retry
                    </Button>
                  </Box>
                </Stack>
              ) : batches.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  This student is not part of any batch yet.
                </Typography>
              ) : (
                <Box sx={{ pt: 1 }}>
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
                          <TableCell sx={{ fontWeight: 700 }}>Batch Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Batch ID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batches.map((batch) => (
                          <TableRow key={batch.id} hover>
                            <TableCell>
                              <Link
                                href={`/teacher-dashboard/batches/detail?id=${batch.id}`}
                                style={{ textDecoration: "none" }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="primary.main"
                                  sx={{ "&:hover": { textDecoration: "underline" } }}
                                >
                                  {batch.name}
                                </Typography>
                              </Link>
                            </TableCell>
                            <TableCell>{batch.id}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <StudentFormDrawer
        open={isDrawerOpen}
        mode="edit"
        student={student}
        isSaving={isSaving}
        submitError={submitError}
        onClose={() => {
          if (!isSaving) {
            setIsDrawerOpen(false);
            setSubmitError(null);
          }
        }}
        onSave={(values) => {
          void handleSave(values);
        }}
      />
    </Box>
  );
}
