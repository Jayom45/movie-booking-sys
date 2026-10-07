// Map Mongoose input errors (bad ids, failed validation) to 400 instead of 500.
export function errorStatus(error) {
  if (error?.name === 'ValidationError' || error?.name === 'CastError') return 400;
  return error?.status || 500;
}
