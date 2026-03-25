export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

export interface ApiError {
  code?: string;
  message: string;
  statusCode: number;
}

export interface HealthStatus {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
}

export interface AuthActorDto {
  user_id: string;
  email: string;
  org_id: string;
  role: string;
}

export interface AuthResponseDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  actor: AuthActorDto;
}

export interface AuthMeResponseDto {
  actor: AuthActorDto;
}

export interface UserDto {
  user_id: string;
  email: string;
  status: string;
  org_id: string;
  role: string;
  display_name: string | null;
  phone: string | null;
}

export interface StudentBatchDto {
  id: string;
  org_id: string;
  name: string;
}

export interface BatchStudentDto {
  user_id: string;
  display_name: string | null;
}

export interface UpdateBatchMembershipResultDto {
  batch_id: string;
  added_user_ids: string[];
  ignored_user_ids: string[];
  removed_user_ids: string[];
}

export interface RecordingDto {
  id: string;
  title: string;
  raag: string | null;
  taal: string | null;
  notes: string | null;
  mime_type: string;
  created_by_admin_id: string;
  org_id: string;
  object_key: string;
}

export interface AssignmentDto {
  id: string;
  org_id: string;
  recording_id: string;
  assigned_to_user_id: string;
  assigned_by_admin_id: string;
  assigned_at: string;
}

export interface DashboardAssignmentDto extends AssignmentDto {
  recording_title: string;
}

export interface AssignedRecordingDto {
  id: string;
  title: string;
  raag: string | null;
  taal: string | null;
  notes: string | null;
  mime_type: string;
  assigned_at: string;
}

export interface AdminUserRecordingAssignmentDto {
  assignment_id: string;
  assigned_to_user_id: string;
  assigned_by_admin_id: string;
  assigned_at: string;
  recording: Omit<RecordingDto, "object_key">;
}

export type RecordingAttachmentType = "image" | "pdf";

export interface RecordingAttachmentDto {
  id: string;
  org_id: string;
  recording_id: string;
  uploaded_by_user_id: string;
  type: RecordingAttachmentType;
  mime_type: string;
  file_size_bytes: number;
  url: string;
  preview_url: string | null;
  preview_mime_type: string | null;
  preview_expiresAt: string | null;
  created_at: string;
  updated_at: string;
  expiresAt: string;
}

export interface PlaybackResponseDto {
  url: string;
  expiresAt: string;
}

export interface AuthActor {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  displayName?: string | null;
  phone?: string | null;
  status?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  actor: AuthActor;
}

export interface User {
  id: string;
  email: string;
  status: string;
  orgId: string;
  role: string;
  displayName: string | null;
  phone: string | null;
}

export interface StudentBatch {
  id: string;
  orgId: string;
  name: string;
}

export interface BatchStudent {
  userId: string;
  displayName: string | null;
}

export interface UpdateBatchMembershipResult {
  batchId: string;
  addedUserIds: string[];
  ignoredUserIds: string[];
  removedUserIds: string[];
}

export interface Recording {
  id: string;
  title: string;
  raag: string | null;
  taal: string | null;
  notes: string | null;
  mimeType: string;
  createdByAdminId: string;
  orgId: string;
  objectKey: string;
}

export interface Assignment {
  id: string;
  orgId: string;
  recordingId: string;
  assignedToUserId: string;
  assignedByAdminId: string;
  assignedAt: string;
}

export interface DashboardAssignment extends Assignment {
  recordingTitle: string;
}

export interface AssignedRecording {
  id: string;
  title: string;
  raag: string | null;
  taal: string | null;
  notes: string | null;
  mimeType: string;
  assignedAt: string;
}

export interface AdminUserRecordingAssignment {
  assignmentId: string;
  assignedToUserId: string;
  assignedByAdminId: string;
  assignedAt: string;
  recording: Omit<Recording, "objectKey">;
}

export interface RecordingAttachment {
  id: string;
  orgId: string;
  recordingId: string;
  uploadedByUserId: string;
  type: RecordingAttachmentType;
  mimeType: string;
  fileSizeBytes: number;
  url: string;
  previewUrl: string | null;
  previewMimeType: string | null;
  previewExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface PlaybackInfo {
  url: string;
  expiresAt: string;
}

export interface DashboardSummary {
  totals: {
    users: number;
    recordings: number;
    assignments: number;
  };
  recentRecordings: Recording[];
  recentAssignments: DashboardAssignment[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  status?: string;
  role?: string;
  displayName?: string | null;
  phone?: string | null;
}

export interface CreateStudentBatchRequest {
  name: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  status?: string;
  role?: string;
  displayName?: string | null;
  phone?: string | null;
}

export interface CreateRecordingRequest {
  title: string;
  raag?: string | null;
  taal?: string | null;
  notes?: string | null;
  mimeType: string;
  file: Blob;
}

export interface UpdateRecordingRequest {
  title?: string;
  raag?: string | null;
  taal?: string | null;
  notes?: string | null;
  mimeType?: string;
}

export interface CreateAssignmentRequest {
  assignedToUserId: string;
}

export interface UploadRecordingAttachmentRequest {
  file: Blob;
  type: RecordingAttachmentType;
  mimeType?: string;
}

export interface DeleteResult {
  success: true;
}
