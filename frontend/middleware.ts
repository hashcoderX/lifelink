// NextAuth middleware to enable session & optional protection. Currently not matching any route explicitly.
export { default } from "next-auth/middleware";
export const config = { matcher: ["/account/:path*"] };
