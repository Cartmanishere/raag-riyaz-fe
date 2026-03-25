"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
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
import UploadIcon from "@mui/icons-material/Upload";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RecordingFormDialog, { RecordingFormValues } from "./RecordingFormDialog";
import RecordingDeleteConfirmDialog from "./RecordingDeleteConfirmDialog";
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

  const loadRecordings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextRecordings = await adminRecordingsApi.list();
      setRecordings(nextRecordings);
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
      setDeleteTarget(undefined);
    } catch (err) {
      const apiError = err as ApiError;
      setDeleteError(toErrorMessage(apiError, "Failed to delete recording."));
    } finally {
      setIsDeleting(false);
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
    </Box>
  );
}
