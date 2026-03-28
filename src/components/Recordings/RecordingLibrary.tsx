"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import UploadIcon from "@mui/icons-material/Upload";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RecordingFormDialog, { RecordingFormValues } from "./RecordingFormDialog";
import RecordingDeleteConfirmDialog from "./RecordingDeleteConfirmDialog";
import BulkAssignRecordingsDialog, {
  BulkAssignTarget,
} from "./BulkAssignRecordingsDialog";
import { adminRecordingsApi } from "@/services/api";
import { ApiError, Recording } from "@/types";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

export default function RecordingLibrary() {
  const router = useRouter();
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  const [search, setSearch] = React.useState("");
  const [raagFilter, setRaagFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Recording | undefined>();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [selectedRecordingIds, setSelectedRecordingIds] = React.useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);
  const [assignFeedback, setAssignFeedback] = React.useState<{
    severity: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  const loadRecordings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRecordings = await adminRecordingsApi.list();
      setRecordings(nextRecordings);
      setSelectedRecordingIds((current) =>
        current.filter((recordingId) =>
          nextRecordings.some((recording) => recording.id === recordingId)
        )
      );
    } catch (err) {
      const apiError = err as ApiError;
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load recordings.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  const raagOptions = Array.from(
    new Set(
      recordings
        .map((recording) => recording.raag?.trim() ?? "")
        .filter((raag) => raag.length > 0)
    )
  ).sort((left, right) => left.localeCompare(right));

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = recordings.filter((recording) => {
    const recordingRaag = recording.raag?.trim() ?? "";
    const matchesSearch = normalizedSearch
      ? [recording.title, recordingRaag, recording.taal ?? "", recording.notes ?? ""].some(
          (value) => value.toLowerCase().includes(normalizedSearch)
        )
      : true;
    const matchesRaag = raagFilter ? recordingRaag === raagFilter : true;
    return matchesSearch && matchesRaag;
  });

  const handleView = (recording: Recording) => {
    router.push(`/teacher-dashboard/recordings/detail?id=${recording.id}`);
  };

  const handleOpenAdd = () => {
    setSubmitError(null);
    setFormOpen(true);
  };

  const selectedRecordings = React.useMemo(
    () => recordings.filter((recording) => selectedRecordingIds.includes(recording.id)),
    [recordings, selectedRecordingIds]
  );

  const filteredRecordingIds = React.useMemo(
    () => filtered.map((recording) => recording.id),
    [filtered]
  );

  const selectedFilteredCount = React.useMemo(
    () => filteredRecordingIds.filter((id) => selectedRecordingIds.includes(id)).length,
    [filteredRecordingIds, selectedRecordingIds]
  );

  const areAllFilteredSelected =
    filteredRecordingIds.length > 0 && selectedFilteredCount === filteredRecordingIds.length;
  const isFilteredSelectionPartial =
    selectedFilteredCount > 0 && selectedFilteredCount < filteredRecordingIds.length;

  const toggleRecordingSelection = (recordingId: string) => {
    setSelectedRecordingIds((current) =>
      current.includes(recordingId)
        ? current.filter((id) => id !== recordingId)
        : [...current, recordingId]
    );
    setAssignFeedback(null);
  };

  const handleToggleSelectAllFiltered = () => {
    setSelectedRecordingIds((current) => {
      if (areAllFilteredSelected) {
        return current.filter((id) => !filteredRecordingIds.includes(id));
      }

      return Array.from(new Set([...current, ...filteredRecordingIds]));
    });
    setAssignFeedback(null);
  };

  const handleCloseForm = () => {
    if (isSaving) {
      return;
    }

    setFormOpen(false);
    setSubmitError(null);
  };

  const handleOpenDelete = (recording: Recording) => {
    setDeleteTarget(recording);
    setDeleteError(null);
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setDeleteTarget(undefined);
    setDeleteError(null);
  };

  const handleSave = async (values: RecordingFormValues) => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      if (!values.file) {
        setSubmitError("Audio file is required.");
        return;
      }

      const createdRecording = await adminRecordingsApi.create({
        title: values.title.trim(),
        raag: values.raag.trim() || null,
        taal: values.taal.trim() || null,
        notes: values.notes.trim() || null,
        mimeType: values.file.type || "application/octet-stream",
        file: values.file,
      });

      setRecordings((current) => [createdRecording, ...current]);

      setFormOpen(false);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(
        toErrorMessage(
          apiError,
          "Failed to upload recording."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const deletedRecordingId = deleteTarget.id;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await adminRecordingsApi.delete(deletedRecordingId);
      setRecordings((current) =>
        current.filter((recording) => recording.id !== deletedRecordingId)
      );
      setSelectedRecordingIds((current) =>
        current.filter((recordingId) => recordingId !== deletedRecordingId)
      );
      setDeleteTarget(undefined);
    } catch (err) {
      const apiError = err as ApiError;
      setDeleteError(toErrorMessage(apiError, "Failed to delete recording."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseAssignDialog = () => {
    if (isBulkAssigning) {
      return;
    }

    setIsAssignDialogOpen(false);
    setAssignError(null);
  };

  const handleBulkAssign = async (target: BulkAssignTarget) => {
    if (selectedRecordings.length === 0) {
      return;
    }

    setIsBulkAssigning(true);
    setAssignError(null);
    setAssignFeedback(null);

    try {
      const results = await Promise.allSettled(
        selectedRecordings.map(async (recording) => {
          try {
            if (target.type === "batch") {
              await adminRecordingsApi.assignBatch(recording.id, {
                batchId: target.targetId,
              });
            } else {
              await adminRecordingsApi.assign(recording.id, {
                assignedToUserId: target.targetId,
              });
            }

            return { recordingId: recording.id, outcome: "success" as const };
          } catch (error) {
            const apiError = error as ApiError;
            if (apiError.statusCode === 409) {
              return { recordingId: recording.id, outcome: "conflict" as const };
            }

            throw apiError;
          }
        })
      );

      const successIds: string[] = [];
      const conflictIds: string[] = [];
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        const recordingId = selectedRecordings[index]?.id;
        if (!recordingId) {
          return;
        }

        if (result.status === "fulfilled") {
          if (result.value.outcome === "success") {
            successIds.push(recordingId);
          } else {
            conflictIds.push(recordingId);
          }
          return;
        }

        failedIds.push(recordingId);
      });

      const successCount = successIds.length;
      const conflictCount = conflictIds.length;
      const failureCount = failedIds.length;

      setAssignFeedback({
        severity:
          failureCount > 0 ? "error" : conflictCount > 0 ? "warning" : "success",
        message: [
          successCount > 0
            ? `Assigned ${successCount} recording${successCount === 1 ? "" : "s"} to ${target.targetLabel}.`
            : null,
          conflictCount > 0 ? `${conflictCount} already assigned.` : null,
          failureCount > 0 ? `${failureCount} failed.` : null,
        ]
          .filter(Boolean)
          .join(" "),
      });

      if (failureCount === 0) {
        setSelectedRecordingIds((current) =>
          current.filter((id) => !successIds.includes(id) && !conflictIds.includes(id))
        );
      } else {
        setSelectedRecordingIds(failedIds);
      }

      setIsAssignDialogOpen(false);
    } catch (error) {
      const apiError = error as ApiError;
      setAssignError(toErrorMessage(apiError, "Unable to assign the selected recordings."));
    } finally {
      setIsBulkAssigning(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search recordings..."
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
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Raag</InputLabel>
          <Select
            value={raagFilter}
            label="Raag"
            onChange={(event) => setRaagFilter(event.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {raagOptions.map((raag) => (
              <MenuItem key={raag} value={raag}>
                {raag}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={handleOpenAdd}>
          Upload Recording
        </Button>
      </Box>

      {selectedRecordingIds.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            mb: 2,
            px: 2,
            py: 1.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {selectedRecordingIds.length} recording
            {selectedRecordingIds.length === 1 ? "" : "s"} selected
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<AssignmentTurnedInIcon />}
              onClick={() => {
                setAssignError(null);
                setIsAssignDialogOpen(true);
              }}
            >
              Assign
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setSelectedRecordingIds([]);
                setAssignFeedback(null);
              }}
            >
              Clear Selection
            </Button>
          </Box>
        </Box>
      ) : null}

      {assignFeedback ? (
        <Alert severity={assignFeedback.severity} sx={{ mb: 2 }}>
          {assignFeedback.message}
        </Alert>
      ) : null}

      {isLoading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading recordings...
          </Typography>
        </Box>
      ) : error ? (
        <Stack spacing={1.5} sx={{ py: 6, px: 3, textAlign: "center" }}>
          <Typography variant="body2" fontWeight={600}>
            Unable to load recordings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
          <Box sx={{ pt: 0.5 }}>
            <Button variant="outlined" onClick={() => void loadRecordings()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : recordings.length === 0 ? (
        <Alert severity="info">
          No recordings have been uploaded yet.
        </Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          No recordings match your current search or raag filter.
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
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={areAllFilteredSelected}
                    indeterminate={isFilteredSelectionPartial}
                    onChange={handleToggleSelectAllFiltered}
                    inputProps={{ "aria-label": "Select all filtered recordings" }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((recording) => (
                <TableRow
                  key={recording.id}
                  hover
                  onClick={() => handleView(recording)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <Checkbox
                      checked={selectedRecordingIds.includes(recording.id)}
                      onChange={() => toggleRecordingSelection(recording.id)}
                      inputProps={{ "aria-label": `Select ${recording.title}` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {recording.title}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="text"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleView(recording);
                      }}
                    >
                      Manage
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDelete(recording);
                      }}
                      color="error"
                      startIcon={<DeleteOutlineIcon fontSize="small" />}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RecordingFormDialog
        open={formOpen}
        mode="add"
        isSaving={isSaving}
        submitError={submitError}
        onClose={handleCloseForm}
        onSave={(values) => {
          void handleSave(values);
        }}
      />

      <RecordingDeleteConfirmDialog
        open={Boolean(deleteTarget)}
        recordingTitle={deleteTarget?.title ?? ""}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClose={handleCloseDelete}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <BulkAssignRecordingsDialog
        open={isAssignDialogOpen}
        selectedCount={selectedRecordingIds.length}
        isSubmitting={isBulkAssigning}
        submitError={assignError}
        onClose={handleCloseAssignDialog}
        onAssign={(target) => {
          void handleBulkAssign(target);
        }}
      />
    </Box>
  );
}
