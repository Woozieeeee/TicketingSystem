export function getRelativeTime(dateString?: string) {
  if (!dateString) return "No updates yet";
  const now = new Date();
  const updated = new Date(dateString);
  const diffInSeconds = Math.abs(
    Math.floor((now.getTime() - updated.getTime()) / 1000),
  );

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return updated.toLocaleDateString();
}
