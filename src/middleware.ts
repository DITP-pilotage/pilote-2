// https://github.com/nextauthjs/next-auth/discussions/3079

import { withAuth } from "next-auth/middleware";
export default withAuth({
  pages: {
    signIn: "/signIn",
  },
});

export const config = {
  matcher: ['/(.*)'],
}