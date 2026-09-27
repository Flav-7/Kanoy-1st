import type { Role } from "./types";

/**
 * Who may do what in a calendar. The server enforces these on every action
 * (see server/calendar.ts); the UI only uses them to hide controls.
 *  - viewer: sees the calendar's events.
 *  - editor: also creates, edits, cancels and deletes any event in it.
 *  - admin: also manages the calendar itself and its members.
 */
export function canView(role: Role | null | undefined): boolean {
  return role === "viewer" || role === "editor" || role === "admin";
}

export function canEditEvents(role: Role | null | undefined): boolean {
  return role === "editor" || role === "admin";
}

export function canManageCalendar(role: Role | null | undefined): boolean {
  return role === "admin";
}
