import 'dotenv/config';

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Не задана обязательная переменная окружения: ${name}`);
  }

  return value;
}
