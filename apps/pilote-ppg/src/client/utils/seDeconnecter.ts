import { signOut } from "next-auth/react";
import { clearHiddenSlideIn } from "@/components/PageAccueil/SlideInFormations/hiddenSlideInStorage";

// Se reconnecter dans le même onglet est une nouvelle visite : la slide-in des formations
// masquée par la croix doit revenir.
export const seDeconnecter = () => {
  clearHiddenSlideIn();
  return signOut();
};
