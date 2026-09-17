/**
 * Pass-through for S3 pre-signed URLs.
 * Signature parameters (x-amz-checksum-mode, x-id, etc.) must remain intact
 * to prevent AWS SignatureDoesNotMatch errors.
 */
export const sanitizeS3Url = (url) => {
  if (!url || typeof url !== 'string') return null;
  return url;
};

