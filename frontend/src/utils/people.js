const AVATAR_COLORS = ['#4f46e5', '#0f766e', '#c2410c', '#7e22ce', '#0369a1', '#be185d', '#4d7c0f'];

/** "Dhananjaya Murthy" -> "DM" */
export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Stable colour per user so the same person always looks the same. */
export function avatarColor(userId) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

/** "Prakash Kumar (Technician)"; a null user is the System. */
export function personLabel(user) {
  return user ? `${user.name} (${user.designation})` : 'System';
}
