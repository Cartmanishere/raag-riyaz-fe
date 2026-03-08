"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Student, students as seedStudents, teachers } from "@/data/seed";
import StudentRow from "./StudentRow";
import StudentFormDrawer from "./StudentFormDrawer";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const currentTeacher = teachers[0];

type DrawerMode = "add" | "edit";

export default function StudentList() {
  const router = useRouter();

  const [students, setStudents] = React.useState<Student[]>(
    seedStudents.filter((s) => s.teacherId === currentTeacher.id)
  );
  const [search, setSearch] = React.useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerMode, setDrawerMode] = React.useState<DrawerMode>("add");
  const [selectedStudent, setSelectedStudent] = React.useState<Student | undefined>();

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<Student | undefined>();

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setDrawerMode("add");
    setSelectedStudent(undefined);
    setDrawerOpen(true);
  };

  const handleEdit = (student: Student) => {
    setDrawerMode("edit");
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  const handleDeleteRequest = (student: Student) => {
    setDeleteTarget(student);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(undefined);
  };

  const handleSave = (values: {
    name: string;
    email: string;
    status: "Active" | "Inactive";
    level: "Beginner" | "Intermediate" | "Advanced";
  }) => {
    if (drawerMode === "add") {
      const newStudent: Student = {
        id: Date.now(),
        username: values.name.toLowerCase().replace(/\s+/g, ""),
        password: "student123",
        instrument: "",
        teacherId: currentTeacher.id,
        joinDate: new Date().toISOString().split("T")[0],
        progress: 0,
        ...values,
      };
      setStudents((prev) => [...prev, newStudent]);
    } else if (selectedStudent) {
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? { ...s, ...values } : s))
      );
    }
    setDrawerOpen(false);
  };

  return (
    <Box>
      {/* Page header */}
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
            Manage all students
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Student
        </Button>
      </Box>

      {/* Search bar */}
      <TextField
        placeholder="Search by name..."
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

      {/* Student list */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No students found.
            </Typography>
          </Box>
        ) : (
          filtered.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onView={(id) => router.push(`/teacher-dashboard/students/${id}`)}
            />
          ))
        )}
      </Paper>

      {/* Add / Edit drawer */}
      <StudentFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        student={selectedStudent}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        studentName={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
