import { z } from "zod";

/**
 * Environment variable schema.
 *
 * - Mark variables as .optional() when they are not required in all environments.
 * - Mark variables as .string().min(1) when they MUST be set before the app starts.
 *
 * Validated once at boot time; the app crashes fast with a readable error if config is invalid.
 */
const envSchema = z.object({
    // Database — optional: app runs in in-memory demo mode when absent
    DATABASE_URL: z.string().url().optional(),
    SUPABASE_DATABASE_URL: z.string().url().optional(),

    // Storage — optional in demo mode, required for production document uploads
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_REGION: z.string().optional(),

    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Validates process.env against the schema.
 * Call this once at app startup (e.g., in root layout).
 * Throws with a readable error message if required config is missing.
 */
export function validateEnv(): Env {
    if (_env) {
        return _env;
    }

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const formatted = result.error.issues
            .map((e) => `  • ${e.path.map(String).join(".")}: ${e.message}`)
            .join("\n");

        const message = `\n[BuyerOS] ❌ Invalid environment configuration:\n${formatted}\n\nFix your .env file and restart the server.\n`;

        // In production, hard crash. In development, log prominently.
        if (process.env.NODE_ENV === "production") {
            throw new Error(message);
        } else {
            console.error(message);
        }
    }

    _env = result.data as Env;
    return _env;
}

/**
 * Typed accessor for environment variables.
 * Only safe to call after validateEnv() has run.
 */
export function getEnv(): Env {
    if (!_env) {
        return validateEnv();
    }
    return _env;
}
