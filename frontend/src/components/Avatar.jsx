// A simple initials avatar — a coloured circle with the person's initials.
// No image uploads or storage needed; the colour is derived from the name so it
// is stable per person.

const COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
  "bg-amber-500", "bg-teal-500", "bg-red-500", "bg-indigo-500",
];

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function colorFor(name) {
  let hash = 0;
  for (const ch of name || "") hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

const Avatar = ({ name, className = "size-6 text-xs" }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${colorFor(name)} ${className}`}
    title={name}
  >
    {initials(name)}
  </span>
);

export default Avatar;
