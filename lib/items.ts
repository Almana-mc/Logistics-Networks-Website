export const itemName = (id: string) =>
  (id.split(":").pop() || id)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
