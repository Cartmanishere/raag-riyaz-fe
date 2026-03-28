"use client";

import * as React from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import {
  Alert,
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
import { deriveActorDisplayName } from "@/services/auth-session";
import { adminRecordingsApi, adminStudentBatchesApi, adminUsersApi } from "@/services/api";
import {
  AdminBatchRecordingAssignment,
  ApiError,
  BatchStudent,
  StudentBatch,
  User,
} from "@/types";
import AddStudentsDialog from "./AddStudentsDialog";

const USER_ROLE = "user";

function isNotFoundError(error: ApiError | null) {
  return error?.statusCode === 404;
}

function getBatchStudentLabel(student: BatchStudent) {
  return student.displayName?.trim() || student.userId;
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

interface BatchDetailPageClientProps {
  id: string;
}

export default function BatchDetailPageClient({ id }: BatchDetailPageClientProps) {
  const [activeTab, setActiveTab] = React.useState<"students" | "recordings">("students");
  const [batch, setBatch] = React.useState<StudentBatch | null>(null);
  const [students, setStudents] = React.useState<BatchStudent[]>([]);
  const [recordings, setRecordings] = React.useState<AdminBatchRecordingAssignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [areStudentsLoading, setAreStudentsLoading] = React.useState(true);
  const [studentsError, setStudentsError] = React.useState<ApiError | null>(null);
  const [areRecordingsLoading, setAreRecordingsLoading] = React.useState(true);
  const [recordingsError, setRecordingsError] = React.useState<ApiError | null>(null);
  const [availableStudents, setAvailableStudents] = React.useState<User[]>([]);
  const [areAvailableStudentsLoading, setAreAvailableStudentsLoading] = React.useState(false);
  const [availableStudentsError, setAvailableStudentsError] = React.useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [addStudentsError, setAddStudentsError] = React.useState<string | null>(null);
  const [isAddingStudents, setIsAddingStudents] = React.useState(false);
  const [removingStudentId, setRemovingStudentId] = React.useState<string | null>(null);
  const [unassigningRecordingId, setUnassigningRecordingId] = React.useState<string | null>(null);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const [unassignError, setUnassignError] = React.useState<string | null>(null);

  const loadBatch = React.useCallback(async () => {
    if (!id.trim()) {
      setBatch(null);
      setError({
        message: "Invalid batch ID.",
        statusCode: 404,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextBatch = await adminStudentBatchesApi.getById(id);
      setBatch(nextBatch);
    } catch (err) {
      const apiError = err as ApiError;
      setBatch(null);
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load batch.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadStudents = React.useCallback(async () => {
    if (!id.trim()) {
      setStudents([]);
      setStudentsError({
        message: "Invalid batch ID.",
        statusCode: 404,
      });
      setAreStudentsLoading(false);
      return;
    }

    setAreStudentsLoading(true);
    setStudentsError(null);
    setRemoveError(null);

    try {
      const nextStudents = await adminStudentBatchesApi.listStudents(id);
      setStudents(nextStudents);
    } catch (err) {
      const apiError = err as ApiError;
      setStudents([]);
      setStudentsError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load batch students.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setAreStudentsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadBatch();
  }, [loadBatch]);

  React.useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const loadRecordings = React.useCallback(async () => {
    if (!id.trim()) {
      setRecordings([]);
      setRecordingsError({
        message: "Invalid batch ID.",
        statusCode: 404,
      });
      setAreRecordingsLoading(false);
      return;
    }

    setAreRecordingsLoading(true);
    setRecordingsError(null);
    setUnassignError(null);

    try {
      const nextRecordings = await adminStudentBatchesApi.listRecordings(id);
      setRecordings(nextRecordings);
    } catch (err) {
      const apiError = err as ApiError;
      setRecordings([]);
      setRecordingsError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load batch recordings.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setAreRecordingsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  const loadAvailableStudents = React.useCallback(async () => {
    setAreAvailableStudentsLoading(true);
    setAvailableStudentsError(null);

    try {
      const users = await adminUsersApi.list();
      const currentMemberIds = new Set(students.map((student) => student.userId));
      const eligibleUsers = users.filter(
        (user) => user.role.toLowerCase() === USER_ROLE && !currentMemberIds.has(user.id)
      );

      setAvailableStudents(eligibleUsers);
    } catch (err) {
      const apiError = err as ApiError;
      setAvailableStudents([]);
      setAvailableStudentsError(apiError?.message ?? "Failed to load students.");
    } finally {
      setAreAvailableStudentsLoading(false);
    }
  }, [students]);

  const handleOpenAddDialog = async () => {
    setAddStudentsError(null);
    setAvailableStudents([]);
    await loadAvailableStudents();
    setIsAddDialogOpen(true);
  };

  const handleAddStudents = async (userIds: string[]) => {
    if (!id.trim()) {
      return;
    }

    setIsAddingStudents(true);
    setAddStudentsError(null);

    try {
      const result = await adminStudentBatchesApi.bulkAddStudents(id, { userIds });
      const addedIds = new Set(result.addedUserIds);
      const addedStudents = availableStudents
        .filter((user) => addedIds.has(user.id))
        .map((user) => ({
          userId: user.id,
          displayName: deriveActorDisplayName(user),
        }));

      setStudents((current) => [...current, ...addedStudents]);
      setAvailableStudents((current) =>
        current.filter((student) => !addedIds.has(student.id))
      );
      setIsAddDialogOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      setAddStudentsError(apiError?.message ?? "Failed to add students to this batch.");
    } finally {
      setIsAddingStudents(false);
    }
  };

  const handleRemoveStudent = async (student: BatchStudent) => {
    if (!id.trim()) {
      return;
    }

    setRemovingStudentId(student.userId);
    setRemoveError(null);

    try {
      await adminStudentBatchesApi.bulkRemoveStudents(id, { userIds: [student.userId] });
      setStudents((current) => current.filter((member) => member.userId !== student.userId));
    } catch (err) {
      const apiError = err as ApiError;
      setRemoveError(apiError?.message ?? "Failed to remove student from this batch.");
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleUnassignRecording = async (assignment: AdminBatchRecordingAssignment) => {
    setUnassigningRecordingId(assignment.assignmentId);
    setUnassignError(null);

    try {
      await adminRecordingsApi.unassignBatch(assignment.recording.id, assignment.batchId);
      setRecordings((current) =>
        current.filter((item) => item.assignmentId !== assignment.assignmentId)
      );
    } catch (err) {
      const apiError = err as ApiError;
      setUnassignError(apiError?.message ?? "Failed to unassign recording from this batch.");
    } finally {
      setUnassigningRecordingId(null);
    }
  };

  const backLink = (
    <Link href="/teacher-dashboard/batches" style={{ textDecoration: "none" }}>
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
        <Typography variant="body2">Back to Batches</Typography>
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
              Loading batch details...
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
                Batch not found
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

  if (error || !batch) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>{backLink}</Box>
        <Card>
          <CardContent sx={{ py: 6 }}>
            <Stack spacing={2}>
              <Alert severity="error">
                {error?.message ?? "Unable to load this batch."}
              </Alert>
              <Box>
                <Button variant="outlined" onClick={() => void loadBatch()}>
                  Retry
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>{backLink}</Box>

      <Card sx={{ mb: 3 }}>
        <CardContent
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            p: 3,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.75 }}>
              {batch.name}
            </Typography>
            <Stack spacing={0.75}>
              <Typography variant="body2" color="text.secondary">
                Batch ID: {batch.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Students: {students.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recordings: {recordings.length}
              </Typography>
            </Stack>
          </Box>

          <Button
            variant="contained"
            startIcon={<GroupAddIcon />}
            onClick={() => {
              void handleOpenAddDialog();
            }}
          >
            Add Students
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_event, value: "students" | "recordings") => setActiveTab(value)}
            >
              <Tab label={`Students (${students.length})`} value="students" />
              <Tab label={`Recordings (${recordings.length})`} value="recordings" />
            </Tabs>
          </Box>

          {activeTab === "students" ? (
            <>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Students
              </Typography>

              {removeError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {removeError}
                </Alert>
              ) : null}

              {areStudentsLoading ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading batch students...
                  </Typography>
                </Box>
              ) : studentsError ? (
                <Stack spacing={1.5} sx={{ pt: 1 }}>
                  <Alert severity="error">{studentsError.message}</Alert>
                  <Box>
                    <Button variant="outlined" onClick={() => void loadStudents()}>
                      Retry
                    </Button>
                  </Box>
                </Stack>
              ) : students.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No students have been added to this batch yet.
                </Typography>
              ) : (
                <TableContainer
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflowX: "auto",
                    mt: 1,
                  }}
                >
                  <Table sx={{ minWidth: 720 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>User ID</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.userId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {getBatchStudentLabel(student)}
                            </Typography>
                          </TableCell>
                          <TableCell>{student.userId}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              color="error"
                              variant="text"
                              startIcon={<DeleteOutlineIcon fontSize="small" />}
                              onClick={() => {
                                void handleRemoveStudent(student);
                              }}
                              disabled={removingStudentId === student.userId}
                            >
                              {removingStudentId === student.userId ? "Removing..." : "Remove"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : (
            <>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Recordings
              </Typography>

              {unassignError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {unassignError}
                </Alert>
              ) : null}

              {areRecordingsLoading ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    Loading batch recordings...
                  </Typography>
                </Box>
              ) : recordingsError ? (
                <Stack spacing={1.5} sx={{ pt: 1 }}>
                  <Alert severity="error">{recordingsError.message}</Alert>
                  <Box>
                    <Button variant="outlined" onClick={() => void loadRecordings()}>
                      Retry
                    </Button>
                  </Box>
                </Stack>
              ) : recordings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No recordings have been assigned to this batch yet.
                </Typography>
              ) : (
                <TableContainer
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflowX: "auto",
                    mt: 1,
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
                      {recordings.map((assignment) => (
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
                                void handleUnassignRecording(assignment);
                              }}
                              disabled={unassigningRecordingId === assignment.assignmentId}
                            >
                              {unassigningRecordingId === assignment.assignmentId
                                ? "Unassigning..."
                                : "Unassign"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddStudentsDialog
        open={isAddDialogOpen}
        students={availableStudents}
        isSaving={isAddingStudents || areAvailableStudentsLoading}
        submitError={addStudentsError ?? availableStudentsError}
        onClose={() => {
          if (!isAddingStudents && !areAvailableStudentsLoading) {
            setIsAddDialogOpen(false);
            setAddStudentsError(null);
          }
        }}
        onSave={(userIds) => {
          void handleAddStudents(userIds);
        }}
      />
    </Box>
  );
}
