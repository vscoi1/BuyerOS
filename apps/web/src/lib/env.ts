function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseInteger(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

const demoAuthEnabled = parseBoolean(
  process.env.DEMO_AUTH_ENABLED ?? process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED,
  !isProduction,
);

export const env = {
  nodeEnv,
  isProduction,
  demoAuthEnabled,
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "buyeros-session",
  portalSessionCookieName:
    process.env.PORTAL_SESSION_COOKIE_NAME ?? "buyeros-portal-session",
  sessionMaxAgeSeconds: parseInteger(process.env.SESSION_MAX_AGE_SECONDS, 60 * 60 * 24 * 7),
} as const;

let hasValidated = false;

export function validateEnv(): void {
  if (hasValidated) {
    return;
  }

  const errors: string[] = [];

  if (!env.sessionCookieName.trim()) {
    errors.push("SESSION_COOKIE_NAME must not be empty.");
  }
  if (!env.portalSessionCookieName.trim()) {
    errors.push("PORTAL_SESSION_COOKIE_NAME must not be empty.");
  }

  const serverDemoFlag = process.env.DEMO_AUTH_ENABLED;
  const publicDemoFlag = process.env.NEXT_PUBLIC_DEMO_AUTH_ENABLED;
  if (serverDemoFlag === "false" && publicDemoFlag === "true") {
    errors.push(
      "DEMO_AUTH_ENABLED=false cannot be combined with NEXT_PUBLIC_DEMO_AUTH_ENABLED=true.",
    );
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\\n- ${errors.join("\\n- ")}`);
  }

  hasValidated = true;
}
