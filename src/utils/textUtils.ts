export function toCamelCase(text: string) {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char, index) =>
      index === 0 ? char.toLowerCase() : char.toUpperCase()
    )
    .replace(/\s+/g, "");
}
