export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 1)}...${address.slice(-chars)}`;
}

export function formatTimestamp(unix) {
  const date = new Date(unix * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 6) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

export function reputationLabel(score) {
  if (score >= 800) return { label: "Elite", color: "#0f172a" };
  if (score >= 500) return { label: "Trusted", color: "#2563eb" };
  if (score >= 200) return { label: "Active", color: "#16a34a" };
  return { label: "New", color: "#737373" };
}

export function scoreLabel(score) {
  const map = { 1: "Poor", 2: "Fair", 3: "Average", 4: "Good", 5: "Excellent" };
  return map[score] ?? "";
}
