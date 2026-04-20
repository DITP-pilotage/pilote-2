import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Session } from "next-auth";
import { estAutoriséACentreAideEval } from "@/client/utils/centre-aide/permissions";

const vérifierDroitPiloteEval = (session: Session) => {
  const peutVoirCentreAideEval = estAutoriséACentreAideEval(
    session.applicationsAccessibles,
  );

  if (!peutVoirCentreAideEval) {
    const centreAideEval = document.querySelector(
      'button[data-href*="centre-aide-eval"]',
    );
    const parent = centreAideEval?.parentElement;

    if (!parent) return;

    centreAideEval.parentElement.style.display = "none";
  }
};

export function NavigationFilter() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading" || !session) return;

    vérifierDroitPiloteEval(session);
  }, [session, status]);

  return null;
}
