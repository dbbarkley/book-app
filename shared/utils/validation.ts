// Validation utilities

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUsername(username: string): boolean {
  // Username: 3-30 characters, alphanumeric and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

export function isValidPassword(password: string): boolean {
  // Password: at least 8 characters
  return password.length >= 8
}

