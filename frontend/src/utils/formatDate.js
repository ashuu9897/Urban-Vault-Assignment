import dayjs from 'dayjs';

/** "27-Oct-2025 11:40 AM", the format used throughout the wireframe. */
export function formatDateTime(value) {
  return value ? dayjs(value).format('DD-MMM-YYYY h:mm A') : '';
}
