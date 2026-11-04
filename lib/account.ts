/** Up to two initials from a display name, e.g. "Ada King Lovelace" -> "AL". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const memberSinceFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats an account creation date as "Month Year". */
export function formatMemberSince(date: Date | string): string {
  return memberSinceFormatter.format(new Date(date));
}
