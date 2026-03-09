import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
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
  CreateAssignmentRequest,
  CreateRecordingRequest,
  CreateUserRequest,
  DashboardAssignment,
  DashboardAssignmentDto,
  DashboardSummary,
  DeleteResult,
  LoginRequest,
  LogoutRequest,
  NoteImage,
  NoteImageDto,
  PlaybackInfo,
  PlaybackResponseDto,
  Recording,
  RecordingDto,
  RefreshRequest,
  UpdateRecordingRequest,
  UpdateUserRequest,
  UploadNoteImageRequest,
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

function mapRecording(dto: RecordingDto): Recording {
  return {
    id: dto.id,
    title: dto.title,
    raag: dto.raag,
    taal: dto.taal,
    notes: dto.notes,
    mimeType: dto.mime_type,
    createdByAdminId: dto.created_by_admin_id,
    orgId: dto.org_id,
    objectKey: dto.object_key,
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
    raag: dto.raag,
    taal: dto.taal,
    notes: dto.notes,
    mimeType: dto.mime_type,
    assignedAt: dto.assigned_at,
  };
}

function mapNoteImage(dto: NoteImageDto): NoteImage {
  return {
    id: dto.id,
    orgId: dto.org_id,
    recordingId: dto.recording_id,
    uploadedByUserId: dto.uploaded_by_user_id,
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
        raag: payload.raag,
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
        raag: payload.raag,
        taal: payload.taal,
        notes: payload.notes,
        mime_type: payload.mimeType,
      },
    });

    return mapRecording(response.recording);
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

  async listNoteImages(id: string) {
    const response = await request<{ note_images: NoteImageDto[] }>({
      url: `/admin/recordings/${id}/note-images`,
      method: "GET",
    });

    return response.note_images.map(mapNoteImage);
  },

  async uploadNoteImage(id: string, payload: UploadNoteImageRequest) {
    const response = await request<{ note_image: NoteImageDto }>({
      url: `/admin/recordings/${id}/note-images`,
      method: "POST",
      data: buildFormData({
        file: payload.file,
        mime_type: payload.mimeType,
      }),
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return mapNoteImage(response.note_image);
  },

  async deleteNoteImage(recordingId: string, imageId: string): Promise<DeleteResult> {
    await request<void>({
      url: `/admin/recordings/${recordingId}/note-images/${imageId}`,
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

  async listNoteImages(id: string) {
    const response = await request<{ note_images: NoteImageDto[] }>({
      url: `/user/recordings/${id}/note-images`,
      method: "GET",
    });

    return response.note_images.map(mapNoteImage);
  },
};

export default apiClient;
