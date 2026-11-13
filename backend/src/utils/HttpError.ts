// ============================================================================
// utils/HttpError.ts
// A custom Error that also carries an HTTP status code.
// Controllers `throw new HttpError(404, 'Movie not found')` inside their
// try/catch and the central error handler turns it into a JSON response.
// ============================================================================

export class HttpError extends Error {
  statusCode: number; // HTTP status to send back (400, 401, 403, 404, 409...)
  details?: string[]; // Optional list of detailed messages (e.g. validation errors)

  constructor(statusCode: number, message: string, details?: string[]) {
    super(message); // Let the built-in Error class store the message
    this.name = 'HttpError'; // Name shown in stack traces
    this.statusCode = statusCode; // Remember the status code
    this.details = details; // Remember the extra details (may be undefined)
  }
}
