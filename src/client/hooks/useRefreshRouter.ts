import { useRouter } from "next/router";

export const useRefreshRouter = () => {
  const router = useRouter();

  return () => {
    return router.replace(router.asPath, undefined, { scroll: false });
  };
};
