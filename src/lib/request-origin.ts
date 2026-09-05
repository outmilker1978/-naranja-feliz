// Public origin of the request as seen by the client. Yandex API Gateway
// forwards the real Host/Proto in x-forwarded-* headers (the container's own
// request.url points at an internal address like 0.0.0.0:8080), so we must not
// derive redirect bases from request.url directly — nor from a baked-in
// NEXT_PUBLIC_SITE_URL, which silently breaks any environment where the build
// and the runtime host differ (prod vs localhost).
export function requestOrigin(request: Request): string {
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.headers.get("proto") ||
    "https";
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    "localhost:3000";
  return `${proto}://${host}`;
}