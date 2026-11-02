import axios from 'axios';

/**
 * Error thrown by every API call, normalised from the backend's error shape
 * `{ detail, errors: { field: [messages] } }` (or from a network failure).
 */
export class ApiError extends Error {
  constructor({ status, message, fieldErrors = {} }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** 400s are shown inline next to the form; everything else is worth a toast. */
export function isValidationError(error) {
  return error instanceof ApiError && error.status === 400;
}

/** First message for `field`, or undefined. */
export function fieldError(error, field) {
  return error instanceof ApiError ? error.fieldErrors[field]?.[0] : undefined;
}

// DEMO ONLY: the selected "Viewing as" user is sent on every request and the backend trusts
// it. It is kept outside React so the interceptor always reads the latest value synchronously.
let actingUserId = null;

export function setActingUserId(userId) {
  actingUserId = userId;
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (actingUserId != null) {
    config.headers['X-User-Id'] = String(actingUserId);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normaliseError(error)),
);

function normaliseError(error) {
  if (!error.response) {
    return new ApiError({
      status: 0,
      message: 'Could not reach the server. Check your connection and try again.',
    });
  }
  const { status, data } = error.response;
  const fieldErrors = data?.errors ?? {};
  const message =
    data?.detail ||
    fieldErrors.non_field_errors?.[0] ||
    (status >= 500 ? 'Something went wrong on our side. Please try again.' : 'Request failed.');
  return new ApiError({ status, message, fieldErrors });
}
