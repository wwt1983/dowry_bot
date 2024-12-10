export function formatError(error) {
  if (error instanceof Error) {
    return `Error: ${error.message}\nStack: ${error.stack}`;
  }
  return `Unknown error: ${JSON.stringify(error, null, 2)}`;
}
