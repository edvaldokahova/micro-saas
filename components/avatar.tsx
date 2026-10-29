// Inicial num círculo colorido, como nos contactos do telemóvel: cada letra tem sempre a mesma cor.
const COLORS = [
  "#3DB39E", // A
  "#F28B44", // B
  "#1E88E5", // C
  "#5B8DBE", // D
  "#26A69A", // E
  "#E5677A", // F
  "#8E6FD8", // G
  "#F0A030", // H
  "#43A0D8", // I
  "#E0607E", // J
  "#5C9E5A", // K
  "#B98A2E", // L
  "#7A6FE0", // M
  "#2E9BB8", // N
  "#E57A4A", // O
  "#9C64C8", // P
  "#3F8F7A", // Q
  "#D9566B", // R
  "#4A7FD8", // S
  "#C7843A", // T
  "#52A88C", // U
  "#6B79C9", // V
  "#D46A9A", // W
  "#4F9DB0", // X
  "#A8A23A", // Y
  "#7C8792", // Z
];

export function initial(name: string): string {
  const ch = name.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  return ch || "?";
}

export function avatarColor(name: string): string {
  const c = initial(name);
  const i = c.charCodeAt(0) - 65;
  return i >= 0 && i < 26 ? COLORS[i] : "#7C8792";
}

export function Avatar({ name, className = "h-9 w-9 text-[15px]" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 select-none place-items-center rounded-full font-semibold text-white ${className}`}
      style={{ background: avatarColor(name) }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
