export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export function problemMessage(error: unknown): string {
  const maybeError = error as { error?: ProblemDetail; message?: string };
  const detail = maybeError.error;

  if (detail?.title && detail.detail) {
    return `${detail.title}: ${detail.detail}`;
  }

  return detail?.detail ?? detail?.title ?? maybeError.message ?? 'The request could not be completed.';
}
