"use client";

import * as React from "react";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { deriveActorDisplayName } from "@/services/auth-session";
import { adminStudentBatchesApi, adminUsersApi } from "@/services/api";
import { ApiError, StudentBatch, User } from "@/types";

const USER_ROLE = "user";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

function isStudentUser(user: User) {
  return user.role.toLowerCase() === USER_ROLE;
}

function sortUsers(users: User[]) {
  return [...users].sort((left, right) =>
    deriveActorDisplayName(left).localeCompare(deriveActorDisplayName(right))
  );
}

function sortBatches(batches: StudentBatch[]) {
  return [...batches].sort((left, right) => left.name.localeCompare(right.name));
}

export type BulkAssignTarget =
  | { type: "batch"; targetId: string; targetLabel: string }
  | { type: "student"; targetId: string; targetLabel: string };

interface BulkAssignRecordingsDialogProps {
  open: boolean;
  selectedCount: number;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onAssign: (target: BulkAssignTarget) => void;
}

export default function BulkAssignRecordingsDialog({
  open,
  selectedCount,
  isSubmitting,
  submitError,
  onClose,
  onAssign,
}: BulkAssignRecordingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState<"batch" | "student">("batch");
  const [batches, setBatches] = React.useState<StudentBatch[]>([]);
  const [students, setStudents] = React.useState<User[]>([]);
  const [isBatchesLoading, setIsBatchesLoading] = React.useState(false);
  const [isStudentsLoading, setIsStudentsLoading] = React.useState(false);
  const [batchesError, setBatchesError] = React.useState<string | null>(null);
  const [studentsError, setStudentsError] = React.useState<string | null>(null);
  const [batchSearch, setBatchSearch] = React.useState("");
  const [studentSearch, setStudentSearch] = React.useState("");
  const [selectedBatchId, setSelectedBatchId] = React.useState("");
  const [selectedStudentId, setSelectedStudentId] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab("batch");
    setBatchSearch("");
    setStudentSearch("");
    setSelectedBatchId("");
    setSelectedStudentId("");

    let cancelled = false;

    const loadBatches = async () => {
      setIsBatchesLoading(true);
      setBatchesError(null);

      try {
        const nextBatches = await adminStudentBatchesApi.list();
        if (cancelled) {
          return;
        }

        setBatches(sortBatches(nextBatches));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBatches([]);
        setBatchesError(
          toErrorMessage(error as ApiError, "Unable to load batches for assignment.")
        );
      } finally {
        if (!cancelled) {
          setIsBatchesLoading(false);
        }
      }
    };

    const loadStudents = async () => {
      setIsStudentsLoading(true);
      setStudentsError(null);

      try {
        const users = await adminUsersApi.list();
        if (cancelled) {
          return;
        }

        setStudents(sortUsers(users.filter(isStudentUser)));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStudents([]);
        setStudentsError(
          toErrorMessage(error as ApiError, "Unable to load students for assignment.")
        );
      } finally {
        if (!cancelled) {
          setIsStudentsLoading(false);
        }
      }
    };

    void loadBatches();
    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const filteredBatches = React.useMemo(() => {
    const normalized = batchSearch.trim().toLowerCase();
    if (!normalized) {
      return batches;
    }

    return batches.filter(
      (batch) =>
        batch.name.toLowerCase().includes(normalized) ||
        batch.id.toLowerCase().includes(normalized)
    );
  }, [batchSearch, batches]);

  const filteredStudents = React.useMemo(() => {
    const normalized = studentSearch.trim().toLowerCase();
    if (!normalized) {
      return students;
    }

    return students.filter((student) => {
      const displayName = deriveActorDisplayName(student).toLowerCase();
      return (
        displayName.includes(normalized) ||
        student.email.toLowerCase().includes(normalized) ||
        (student.id ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [studentSearch, students]);

  const selectedTarget = React.useMemo<BulkAssignTarget | null>(() => {
    if (activeTab === "batch") {
      const batch = batches.find((item) => item.id === selectedBatchId);
      return batch
        ? { type: "batch", targetId: batch.id, targetLabel: batch.name }
        : null;
    }

    const student = students.find((item) => item.id === selectedStudentId);
    return student
      ? {
          type: "student",
          targetId: student.id,
          targetLabel: deriveActorDisplayName(student),
        }
      : null;
  }, [activeTab, batches, selectedBatchId, selectedStudentId, students]);

  const handleAssign = () => {
    if (!selectedTarget) {
      return;
    }

    onAssign(selectedTarget);
  };

  const renderBatchContent = () => {
    if (isBatchesLoading) {
      return (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Loading batches...
          </Typography>
        </Box>
      );
    }

    if (batchesError) {
      return <Alert severity="error">{batchesError}</Alert>;
    }

    if (batches.length === 0) {
      return <Alert severity="info">No batches are available for assignment.</Alert>;
    }

    if (filteredBatches.length === 0) {
      return <Alert severity="info">No batches match your current search.</Alert>;
    }

    return (
      <List
        disablePadding
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {filteredBatches.map((batch, index) => (
          <ListItemButton
            key={batch.id}
            selected={batch.id === selectedBatchId}
            onClick={() => setSelectedBatchId(batch.id)}
            sx={index < filteredBatches.length - 1 ? { borderBottom: "1px solid", borderColor: "divider" } : undefined}
          >
            <ListItemText primary={batch.name} secondary={`Batch ID: ${batch.id}`} />
          </ListItemButton>
        ))}
      </List>
    );
  };

  const renderStudentContent = () => {
    if (isStudentsLoading) {
      return (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Loading students...
          </Typography>
        </Box>
      );
    }

    if (studentsError) {
      return <Alert severity="error">{studentsError}</Alert>;
    }

    if (students.length === 0) {
      return <Alert severity="info">No student accounts are available for assignment.</Alert>;
    }

    if (filteredStudents.length === 0) {
      return <Alert severity="info">No students match your current search.</Alert>;
    }

    return (
      <List
        disablePadding
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          maxHeight: 320,
          overflowY: "auto",
        }}
      >
        {filteredStudents.map((student, index) => (
          <ListItemButton
            key={student.id}
            selected={student.id === selectedStudentId}
            onClick={() => setSelectedStudentId(student.id)}
            sx={index < filteredStudents.length - 1 ? { borderBottom: "1px solid", borderColor: "divider" } : undefined}
          >
            <ListItemText
              primary={deriveActorDisplayName(student)}
              secondary={student.email}
            />
          </ListItemButton>
        ))}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign {selectedCount} Recording{selectedCount === 1 ? "" : "s"}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose one batch or one student to receive all selected recordings.
        </Typography>

        {submitError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        ) : null}

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value: "batch" | "student") => setActiveTab(value)}
          >
            <Tab label="Batch" value="batch" />
            <Tab label="Student" value="student" />
          </Tabs>
        </Box>

        {activeTab === "batch" ? (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="Search batches..."
              value={batchSearch}
              onChange={(event) => setBatchSearch(event.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              }}
            />
            {renderBatchContent()}
          </>
        ) : (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="Search students..."
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              }}
            />
            {renderStudentContent()}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAssign} disabled={!selectedTarget || isSubmitting}>
          {isSubmitting ? "Assigning..." : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
