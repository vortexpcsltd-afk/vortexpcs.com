// Config for address lookup providers
// Set VITE_GETADDRESS_IO_API_KEY to enable real address lookup via getaddress.io

// Vite exposes env vars on import.meta.env in the browser
export const GETADDRESS_IO_API_KEY: string | undefined =
  import.meta.env.VITE_GETADDRESS_IO_API_KEY || undefined;

if (import.meta.env.DEV) {
  const hasKey = Boolean(GETADDRESS_IO_API_KEY);
  // eslint-disable-next-line no-console
  console.debug(
    `📬 Address Provider Key: ${hasKey ? "FOUND" : "NOT FOUND"}`,
    hasKey ? `${GETADDRESS_IO_API_KEY?.slice(0, 6)}...` : ""
  );
}
