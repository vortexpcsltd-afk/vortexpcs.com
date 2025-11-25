// Centralized feature flags for the client

type Env = Record<string, string | boolean | undefined>;

const env = import.meta.env as unknown as Env;

function toBool(val: string | boolean | undefined): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  return false;
}

export function is3DEnabled(): boolean {
  return toBool(env.VITE_ENABLE_3D);
}

export function monitoringDebugEnabled(): boolean {
  return toBool(env.VITE_MONITORING_DEBUG);
}
