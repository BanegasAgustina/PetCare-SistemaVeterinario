export function isValidExpoPushToken(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= 255
    && /^(?:Expo|Exponent)PushToken\[[A-Za-z0-9_.-]+\]$/.test(value);
}
