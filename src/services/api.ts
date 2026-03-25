import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  AdminUserRecordingAssignment,
  AdminUserRecordingAssignmentDto,
  ApiError,
  ApiErrorPayload,
  AssignedRecording,
  AssignedRecordingDto,
  Assignment,
  AssignmentDto,
  AuthActor,
  AuthActorDto,
  AuthMeResponseDto,
  AuthResponseDto,
  AuthSession,
  BatchStudent,
  BatchStudentDto,
  CreateAssignmentRequest,
  CreateRecordingRequest,
  CreateStudentBatchRequest,
  CreateUserRequest,
  DashboardAssignment,
  DashboardAssignmentDto,
  DashboardSummary,
  DeleteResult,
  LoginRequest,
  LogoutRequest,
  PlaybackInfo,
  PlaybackResponseDto,
  RecordingAttachment,
  RecordingAttachmentDto,
  StudentBatch,
  StudentBatchDto,
  Recording,
  RecordingDto,
  RefreshRequest,
  UpdateBatchMembershipResult,
  UpdateBatchMembershipResultDto,
  UpdateRecordingRequest,
  UpdateUserRequest,
  UploadRecordingAttachmentRequest,
  User,
  UserDto,
} from "@/types";
import {
  clearSessionSnapshot,
  getSessionSnapshot,
  setSessionSnapshot,
} from "@/services/auth-session";

export const DEFAULT_API_BASE_URL = "https://stg-raag-riyaz-api.kanha.dev";

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_API_BASE_URL
  );
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuthRefresh?: boolean;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

function mapActor(dto: AuthActorDto): AuthActor {
  return {
    userId: dto.user_id,
    email: dto.email,
    orgId: dto.org_id,
    role: dto.role,
  };
}

function mapSession(dto: AuthResponseDto): AuthSession {
  return {
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token,
    tokenType: dto.token_type,
    expiresIn: dto.expires_in,
    actor: mapActor(dto.actor),
  };
}

function mapUser(dto: UserDto): User {
  return {
    id: dto.user_id,
    email: dto.email,
    status: dto.status,
    orgId: dto.org_id,
    role: dto.role,
    displayName: dto.display_name,
    phone: dto.phone,
  };
}

function mapStudentBatch(dto: StudentBatchDto): StudentBatch {
  return {
    id: dto.id,
    orgId: dto.org_id,
    name: dto.name,
  };
}

function mapBatchStudent(dto: BatchStudentDto): BatchStudent {
  return {
    userId: dto.user_id,
    displayName: dto.display_name,
  };
}

function mapUpdateBatchMembershipResult(
  dto: UpdateBatchMembershipResultDto,
): UpdateBatchMembershipResult {
  return {
    batchId: dto.batch_id,
    addedUserIds: dto.added_user_ids,
    ignoredUserIds: dto.ignored_user_ids,
    removedUserIds: dto.removed_user_ids,
  };
}

function mapRecording(dto: RecordingDto): Recording {
  return {
    id: dto.id,
    title: dto.title,
    raag: dto.raag ?? null,
    taal: dto.taal,
    notes: dto.notes,
    mimeType: dto.mime_type,
    createdByAdminId: dto.created_by_admin_id,
    orgId: dto.org_id,
    objectKey: dto.object_key,
  };
}

function mapAdminUserRecordingAssignment(
  dto: AdminUserRecordingAssignmentDto,
): AdminUserRecordingAssignment {
  return {
    assignmentId: dto.assignment_id,
    assignedToUserId: dto.assigned_to_user_id,
    assignedByAdminId: dto.assigned_by_admin_id,
    assignedAt: dto.assigned_at,
    recording: {
      id: dto.recording.id,
      title: dto.recording.title,
      raag: dto.recording.raag ?? null,
      taal: dto.recording.taal,
      notes: dto.recording.notes,
      mimeType: dto.recording.mime_type,
      createdByAdminId: dto.recording.created_by_admin_id,
      orgId: dto.recording.org_id,
    },
  };
}

function mapAssignment(dto: AssignmentDto): Assignment {
  return {
    id: dto.id,
    orgId: dto.org_id,
    recordingId: dto.recording_id,
    assignedToUserId: dto.assigned_to_user_id,
    assignedByAdminId: dto.assigned_by_admin_id,
    assignedAt: dto.assigned_at,
  };
}

function mapDashboardAssignment(dto: DashboardAssignmentDto): DashboardAssignment {
  return {
    ...mapAssignment(dto),
    recordingTitle: dto.recording_title,
  };
}

function mapAssignedRecording(dto: AssignedRecordingDto): AssignedRecording {
  return {
    id: dto.id,
    title: dto.title,
    raag: dto.raag ?? null,
    taal: dto.taal,
    notes: dto.notes,
    mimeType: dto.mime_type,
    assignedAt: dto.assigned_at,
  };
}

function mapRecordingAttachment(
  dto: RecordingAttachmentDto,
): RecordingAttachment {
  return {
    id: dto.id,
    orgId: dto.org_id,
    recordingId: dto.recording_id,
    uploadedByUserId: dto.uploaded_by_user_id,
    type: dto.type,
    mimeType: dto.mime_type,
    fileSizeBytes: dto.file_size_bytes,
    url: dto.url,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    expiresAt: dto.expiresAt,
  };
}

function mapPlaybackInfo(dto: PlaybackResponseDto): PlaybackInfo {
  return {
    url: dto.url,
    expiresAt: dto.expiresAt,
  };
}

function normalizeApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const statusCode = axiosError.response?.status ?? 500;
  const errorPayload = axiosError.response?.data?.error;
  const message =
    errorPayload?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    "An error occurred";

  return {
    code: errorPayload?.code,
    message,
    statusCode,
  };
}

function isAuthLifecycleRequest(url?: string) {
  return ["/auth/login", "/auth/refresh", "/auth/logout"].some(
    (path) => url?.endsWith(path)
  );
}

function buildFormData(
  values: Record<string, string | Blob | null | undefined>,
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue;
    }

    formData.append(key, value);
  }

  return formData;
}

function toNullableField(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : null;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const currentSession = getSessionSnapshot();
  if (!currentSession?.refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await axios.post<AuthResponseDto>(
    "/auth/refresh",
    { refresh_token: currentSession.refreshToken },
    {
      baseURL: apiClient.defaults.baseURL,
      timeout: apiClient.defaults.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const nextSession = mapSession(response.data);
  setSessionSnapshot(nextSession);
  return nextSession.accessToken;
}

apiClient.interceptors.request.use(
  (config) => {
    const session = getSessionSnapshot();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const requestConfig = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      requestConfig &&
      !requestConfig._retry &&
      !requestConfig.skipAuthRefresh &&
      !isAuthLifecycleRequest(requestConfig.url)
    ) {
      try {
        requestConfig._retry = true;
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const accessToken = await refreshPromise;
        requestConfig.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(requestConfig);
      } catch (refreshError) {
        clearSessionSnapshot();
        return Promise.reject(normalizeApiError(refreshError));
      }
    }

    return Promise.reject(normalizeApiError(error));
  },
);

async function request<T>(config: RequestOptions): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

export const authApi = {
  async login(credentials: LoginRequest) {
    const response = await request<AuthResponseDto>({
      url: "/auth/login",
      method: "POST",
      data: credentials,
      skipAuthRefresh: true,
    });

    return mapSession(response);
  },

  async refresh(payload: RefreshRequest) {
    const response = await request<AuthResponseDto>({
      url: "/auth/refresh",
      method: "POST",
      data: {
        refresh_token: payload.refreshToken,
      },
      skipAuthRefresh: true,
    });

    return mapSession(response);
  },

  async logout(payload: LogoutRequest) {
    return request<{ revoked: boolean }>({
      url: "/auth/logout",
      method: "POST",
      data: {
        refresh_token: payload.refreshToken,
      },
      skipAuthRefresh: true,
    });
  },

  async getCurrentActor() {
    const response = await request<AuthMeResponseDto>({
      url: "/auth/me",
      method: "GET",
    });

    return mapActor(response.actor);
  },
};

export const adminUsersApi = {
  async list() {
    const response = await request<{ users: UserDto[] }>({
      url: "/admin/users",
      method: "GET",
    });

    return response.users.map(mapUser);
  },

  async getById(id: string) {
    const response = await request<{ user: UserDto }>({
      url: `/admin/users/${id}`,
      method: "GET",
    });

    return mapUser(response.user);
  },

  async listRecordings(id: string) {
    const response = await request<{ recordings: AdminUserRecordingAssignmentDto[] }>({
      url: `/admin/users/${id}/recordings`,
      method: "GET",
    });

    return response.recordings.map(mapAdminUserRecordingAssignment);
  },

  async create(payload: CreateUserRequest) {
    const response = await request<{ user: UserDto }>({
      url: "/admin/users",
      method: "POST",
      data: {
        email: payload.email,
        password: payload.password,
        status: payload.status,
        role: payload.role,
        display_name: payload.displayName,
        phone: payload.phone,
      },
    });

    return mapUser(response.user);
  },

  async update(id: string, payload: UpdateUserRequest) {
    const response = await request<{ user: UserDto }>({
      url: `/admin/users/${id}`,
      method: "PATCH",
      data: {
        email: payload.email,
        password: payload.password,
        status: payload.status,
        role: payload.role,
        display_name: payload.displayName,
        phone: payload.phone,
      },
    });

    return mapUser(response.user);
  },
};

export const adminStudentBatchesApi = {
  async list() {
    const response = await request<{ batches: StudentBatchDto[] }>({
      url: "/admin/student-batches",
      method: "GET",
    });

    return response.batches.map(mapStudentBatch);
  },

  async getById(id: string) {
    const response = await request<{ batch: StudentBatchDto }>({
      url: `/admin/student-batches/${id}`,
      method: "GET",
    });

    return mapStudentBatch(response.batch);
  },

  async create(payload: CreateStudentBatchRequest) {
    const response = await request<{ batch: StudentBatchDto }>({
      url: "/admin/student-batches",
      method: "POST",
      data: {
        name: payload.name,
      },
    });

    return mapStudentBatch(response.batch);
  },

  async delete(id: string): Promise<DeleteResult> {
    await request<void>({
      url: `/admin/student-batches/${id}`,
      method: "DELETE",
    });

    return { success: true };
  },

  async listStudents(id: string) {
    const response = await request<{ students: BatchStudentDto[] }>({
      url: `/admin/student-batches/${id}/students`,
      method: "GET",
    });

    return response.students.map(mapBatchStudent);
  },

  async bulkAddStudents(id: string, payload: { userIds: string[] }) {
    const response = await request<UpdateBatchMembershipResultDto>({
      url: `/admin/student-batches/${id}/students/bulk-add`,
      method: "POST",
      data: {
        user_ids: payload.userIds,
      },
    });

    return mapUpdateBatchMembershipResult(response);
  },

  async bulkRemoveStudents(id: string, payload: { userIds: string[] }) {
    const response = await request<UpdateBatchMembershipResultDto>({
      url: `/admin/student-batches/${id}/students/bulk-remove`,
      method: "POST",
      data: {
        user_ids: payload.userIds,
      },
    });

    return mapUpdateBatchMembershipResult(response);
  },
};

export const adminRecordingsApi = {
  async list() {
    const response = await request<{ recordings: RecordingDto[] }>({
      url: "/admin/recordings",
      method: "GET",
    });

    return response.recordings.map(mapRecording);
  },

  async getById(id: string) {
    const response = await request<{ recording: RecordingDto }>({
      url: `/admin/recordings/${id}`,
      method: "GET",
    });

    return mapRecording(response.recording);
  },

  async create(payload: CreateRecordingRequest) {
    const response = await request<{ recording: RecordingDto }>({
      url: "/admin/recordings",
      method: "POST",
      data: buildFormData({
        title: payload.title,
        raag: toNullableField(payload.raag),
        taal: toNullableField(payload.taal),
        notes: toNullableField(payload.notes),
        mime_type: payload.mimeType,
        file: payload.file,
      }),
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return mapRecording(response.recording);
  },

  async update(id: string, payload: UpdateRecordingRequest) {
    const response = await request<{ recording: RecordingDto }>({
      url: `/admin/recordings/${id}`,
      method: "PATCH",
      data: {
        title: payload.title,
        raag: toNullableField(payload.raag),
        taal: toNullableField(payload.taal),
        notes: toNullableField(payload.notes),
        mime_type: payload.mimeType,
      },
    });

    return mapRecording(response.recording);
  },

  async delete(id: string): Promise<DeleteResult> {
    await request<void>({
      url: `/admin/recordings/${id}`,
      method: "DELETE",
    });

    return { success: true };
  },

  async getPlayback(id: string) {
    const response = await request<PlaybackResponseDto>({
      url: `/admin/recordings/${id}/playback`,
      method: "GET",
    });

    return mapPlaybackInfo(response);
  },

  async assign(id: string, payload: CreateAssignmentRequest) {
    const response = await request<{ assignment: AssignmentDto }>({
      url: `/admin/recordings/${id}/assign`,
      method: "POST",
      data: {
        assigned_to_user_id: payload.assignedToUserId,
      },
    });

    return mapAssignment(response.assignment);
  },

  async unassign(recordingId: string, userId: string): Promise<DeleteResult> {
    await request<void>({
      url: `/admin/recordings/${recordingId}/assign/${userId}`,
      method: "DELETE",
    });

    return { success: true };
  },

  async listAttachments(id: string) {
    const response = await request<{ attachments: RecordingAttachmentDto[] }>({
      url: `/admin/recordings/${id}/attachments`,
      method: "GET",
    });

    return response.attachments.map(mapRecordingAttachment);
  },

  async uploadAttachment(id: string, payload: UploadRecordingAttachmentRequest) {
    const response = await request<{ attachment: RecordingAttachmentDto }>({
      url: `/admin/recordings/${id}/attachments`,
      method: "POST",
      data: buildFormData({
        type: payload.type,
        file: payload.file,
        mime_type: payload.mimeType,
      }),
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return mapRecordingAttachment(response.attachment);
  },

  async deleteAttachment(
    recordingId: string,
    attachmentId: string,
  ): Promise<DeleteResult> {
    await request<void>({
      url: `/admin/recordings/${recordingId}/attachments/${attachmentId}`,
      method: "DELETE",
    });

    return { success: true };
  },
};

export const adminDashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const response = await request<{
      dashboard: {
        totals: {
          users: number;
          recordings: number;
          assignments: number;
        };
        recent_recordings: RecordingDto[];
        recent_assignments: DashboardAssignmentDto[];
      };
    }>({
      url: "/admin/dashboard",
      method: "GET",
    });

    return {
      totals: response.dashboard.totals,
      recentRecordings: response.dashboard.recent_recordings.map(mapRecording),
      recentAssignments: response.dashboard.recent_assignments.map(
        mapDashboardAssignment,
      ),
    };
  },
};

export const userRecordingsApi = {
  async list() {
    const response = await request<{ recordings: AssignedRecordingDto[] }>({
      url: "/user/recordings",
      method: "GET",
    });

    return response.recordings.map(mapAssignedRecording);
  },

  async getById(id: string) {
    const response = await request<{ recording: AssignedRecordingDto }>({
      url: `/user/recordings/${id}`,
      method: "GET",
    });

    return mapAssignedRecording(response.recording);
  },

  async getPlayback(id: string) {
    const response = await request<PlaybackResponseDto>({
      url: `/user/recordings/${id}/playback`,
      method: "GET",
    });

    return mapPlaybackInfo(response);
  },

  async listAttachments(id: string) {
    const response = await request<{ attachments: RecordingAttachmentDto[] }>({
      url: `/user/recordings/${id}/attachments`,
      method: "GET",
    });

    return response.attachments.map(mapRecordingAttachment);
  },
};

export default apiClient;
