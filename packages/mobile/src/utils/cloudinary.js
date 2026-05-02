const UPLOAD_SEGMENT = "/image/upload/";

/**
 * Injects Cloudinary transformation parameters into a raw upload URL.
 *
 * The raw URL from the API is always stored without transforms, e.g.:
 *   https://res.cloudinary.com/dflvo098t/image/upload/v17.../filename.png
 *
 * We insert the transform string between /upload/ and the version/path:
 *   https://res.cloudinary.com/dflvo098t/image/upload/f_auto,q_auto,.../v17.../filename.png
 *
 * @param {string | null | undefined} url - Raw Cloudinary URL from the API.
 * @param {string} transforms - Comma-separated Cloudinary transformation string.
 * @returns {string | undefined} Optimized URL, or undefined if no URL provided.
 */
function applyCloudinaryTransforms(url, transforms) {
  if (!url) {
    return undefined;
  }

  const insertAt = url.indexOf(UPLOAD_SEGMENT);

  if (insertAt === -1) {
    return url;
  }

  const base = url.slice(0, insertAt + UPLOAD_SEGMENT.length);
  const rest = url.slice(insertAt + UPLOAD_SEGMENT.length);

  return `${base}${transforms}/${rest}`;
}

/**
 * Returns an optimized Cloudinary URL for menu card thumbnails.
 * Width capped at 800px — sufficient for card grids on any device.
 *
 * @param {string | null | undefined} url
 * @returns {string | undefined}
 */
export function getMenuCardImageUrl(url) {
  return applyCloudinaryTransforms(url, "f_auto,q_auto,w_800,c_limit");
}

/**
 * Returns an optimized Cloudinary URL for the full-screen dish hero image.
 * Wider cap (1200px) to keep quality on large tablet/desktop screens.
 *
 * @param {string | null | undefined} url
 * @returns {string | undefined}
 */
export function getDishHeroImageUrl(url) {
  return applyCloudinaryTransforms(url, "f_auto,q_auto,w_1200,c_limit");
}
