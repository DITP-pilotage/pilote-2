import { useRouter } from "next/router";
import { $Enums } from "@prisma/client";

export const useCurrentApplication = () => {
  const router = useRouter();
  return router.pathname.startsWith("/evaluation")
    ? $Enums.application_accessible.PILOTE_EVAL
    : $Enums.application_accessible.PILOTE;
};
