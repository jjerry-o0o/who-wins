function generateCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

export function generateGameCode(): string {
  return generateCode(6)
}

export function generatePassword(): string {
  return generateCode(6)
}
