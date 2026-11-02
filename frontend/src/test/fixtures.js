/** Small, API-shaped test data shared by the component tests. */

const hvac = { id: 1, name: 'Technical (HVAC)' };
const it = { id: 2, name: 'IT & Network' };
const harness = { id: 1, name: 'Harness', site_label: 'Harness-1317; 2F, 3F' };

export const users = {
  client: {
    id: 13,
    name: 'Chaitanya M',
    designation: 'Client POC',
    role: 'client',
    department: null,
    organization: harness,
  },
  poc: {
    id: 1,
    name: 'Dhananjaya Murthy',
    designation: 'Technical Manager',
    role: 'poc',
    department: hvac,
    organization: null,
  },
  technician: {
    id: 2,
    name: 'Prakash Kumar',
    designation: 'Technician',
    role: 'technician',
    department: hvac,
    organization: null,
  },
};

export const categories = [
  { id: 1, name: 'AC not cooling', is_quick_issue: true, department: hvac },
  { id: 5, name: 'Water leakage', is_quick_issue: false, department: hvac },
  { id: 2, name: 'Internet not working', is_quick_issue: true, department: it },
];

const summary = ({ id, name, designation, role }) => ({ id, name, designation, role });

export function buildTicket(overrides = {}) {
  return {
    id: 42,
    code: 'TKT-1042',
    title: 'AC not cooling',
    status: 'pending_assignment',
    status_label: 'Pending Technician Assignment',
    department: hvac,
    organization: harness,
    created_by: summary(users.client),
    assignees: [summary(users.poc)],
    created_at: '2025-10-27T11:40:00+05:30',
    resolved_at: null,
    available_actions: [],
    action_required: false,
    description: 'The air conditioning units on floors 2 and 3 have stopped cooling.',
    activities: [],
    ...overrides,
  };
}
