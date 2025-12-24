export function isLocalhost(): boolean {
  try {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      return h === "localhost" || h === "127.0.0.1";
    }
  } catch {
    // ignore
  }
  return false;
}
