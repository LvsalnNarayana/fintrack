export const getErrorMessage = (error: unknown, defaultMessage = 'An unexpected error occurred'): string => {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object' && error !== null) {
    const candidate = (error as { message?: string; error_description?: string; details?: string });
    if (candidate.message) return candidate.message;
    if (candidate.error_description) return candidate.error_description;
    if (candidate.details) return candidate.details;
  }
  
  return defaultMessage;
};

