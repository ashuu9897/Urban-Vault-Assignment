export const TICKET_STATUS = {
  pending_assignment: { label: 'Pending Technician Assignment', color: 'error' },
  pending_resolution: { label: 'Pending Resolution', color: 'warning' },
  resolved: { label: 'Resolved', color: 'success' },
};

export const STATUS_OPTIONS_BY_TAB = {
  open: ['pending_assignment', 'pending_resolution'],
  resolved: ['resolved'],
};

export const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
];

export const ROLE = {
  client: 'client',
  poc: 'poc',
  technician: 'technician',
};

export const ROLE_LABELS = {
  client: 'Client',
  poc: 'Dept POC',
  technician: 'Technician',
};

export const ROLE_GROUPS = [
  { role: 'client', label: 'Clients' },
  { role: 'poc', label: 'Department POCs' },
  { role: 'technician', label: 'Technicians' },
];

export const PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const COMMENT_MAX_LENGTH = 500;
export const RESOLUTION_COMMENT_MIN_LENGTH = 5;
