export function normalizeNickname(value: string) {
  return value.trim().replaceAll(/\s+/g, ' ').slice(0, 24);
}

export function normalizeTextAnswer(value: string, maxLength: number) {
  return value.trim().replaceAll(/\s+/g, ' ').slice(0, maxLength);
}
