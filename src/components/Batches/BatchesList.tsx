"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
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
import { adminStudentBatchesApi } from "@/services/api";
import { ApiError, StudentBatch } from "@/types";
import BatchFormDialog, { BatchFormValues } from "./BatchFormDialog";
import DeleteBatchConfirmDialog from "./DeleteBatchConfirmDialog";

function toErrorMessage(error: ApiError | null, fallback: string) {
  return error?.message ?? fallback;
}

export default function BatchesList() {
  const router = useRouter();
  const [batches, setBatches] = React.useState<StudentBatch[]>([]);
  const [search, setSearch] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<ApiError | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] = React.useState<StudentBatch | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const loadBatches = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextBatches = await adminStudentBatchesApi.list();
      setBatches(nextBatches);
    } catch (err) {
      const apiError = err as ApiError;
      setError({
        code: apiError?.code,
        message: apiError?.message ?? "Failed to load batches.",
        statusCode: apiError?.statusCode ?? 500,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const handleCreate = async (values: BatchFormValues) => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      const createdBatch = await adminStudentBatchesApi.create(values);
      setBatches((current) => [createdBatch, ...current]);
      setIsCreateDialogOpen(false);
      router.push(`/teacher-dashboard/batches/detail?id=${createdBatch.id}`);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(toErrorMessage(apiError, "Failed to create batch."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!batchToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await adminStudentBatchesApi.delete(batchToDelete.id);
      setBatches((current) => current.filter((batch) => batch.id !== batchToDelete.id));
      setBatchToDelete(null);
    } catch (err) {
      const apiError = err as ApiError;
      setDeleteError(toErrorMessage(apiError, "Failed to delete batch."));
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(normalizedSearch)
  );

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search batches by name..."
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSubmitError(null);
            setIsCreateDialogOpen(true);
          }}
        >
          Add Batch
        </Button>
      </Box>

      {deleteError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {deleteError}
        </Alert>
      ) : null}

      {isLoading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading batches...
          </Typography>
        </Box>
      ) : error ? (
        <Stack spacing={1.5} sx={{ py: 6, px: 3, textAlign: "center" }}>
          <Typography variant="body2" fontWeight={600}>
            Unable to load batches
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
          <Box sx={{ pt: 0.5 }}>
            <Button variant="outlined" onClick={() => void loadBatches()}>
              Retry
            </Button>
          </Box>
        </Stack>
      ) : batches.length === 0 ? (
        <Alert severity="info">No batches found.</Alert>
      ) : filteredBatches.length === 0 ? (
        <Alert severity="info">No batches match your current search.</Alert>
      ) : (
        <TableContainer
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflowX: "auto",
          }}
        >
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Batch ID</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow
                  key={batch.id}
                  hover
                  onClick={() => router.push(`/teacher-dashboard/batches/detail?id=${batch.id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {batch.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{batch.id}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      startIcon={<DeleteOutlineIcon fontSize="small" />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteError(null);
                        setBatchToDelete(batch);
                      }}
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

      <BatchFormDialog
        open={isCreateDialogOpen}
        isSaving={isSaving}
        submitError={submitError}
        onClose={() => {
          if (!isSaving) {
            setIsCreateDialogOpen(false);
            setSubmitError(null);
          }
        }}
        onSave={(values) => {
          void handleCreate(values);
        }}
      />

      <DeleteBatchConfirmDialog
        open={!!batchToDelete}
        batchName={batchToDelete?.name ?? "this batch"}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setBatchToDelete(null);
          }
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </Box>
  );
}
