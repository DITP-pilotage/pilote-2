import { useRouter } from "next/router";
import { useCallback } from "react";

export const useRefreshRouter = () => {
  const router = useRouter();

  return useCallback(() => {
    return router.replace(router.asPath, undefined, { scroll: false });
  }, [router]);
};
