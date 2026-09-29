import type { Session } from "next-auth";
import { createContext, FunctionComponent, ReactNode, useContext } from "react";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import type { ProfilUtilisateurViewModel } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";

export interface DonneesCommunesPage {
  session: Session;
  variablesContenu: VariableContenuDisponibleEnv;
  utilisateurConnecte: ProfilUtilisateurViewModel;
}

const DonneesCommunesPageContext = createContext<Partial<DonneesCommunesPage>>(
  {},
);

export const DonneesCommunesPageProvider: FunctionComponent<{
  value: Partial<DonneesCommunesPage>;
  children: ReactNode;
}> = ({ value, children }) => (
  <DonneesCommunesPageContext.Provider value={value}>
    {children}
  </DonneesCommunesPageContext.Provider>
);

/**
 * Données chargées par le `getServerSideProps` de la page, quand il les fournit.
 * Absentes sur les pages qui ne passent pas par `chargerDonneesCommunesPage` :
 * les hooks retombent alors sur leur requête tRPC.
 */
export const useDonneesCommunesPage = (): Partial<DonneesCommunesPage> =>
  useContext(DonneesCommunesPageContext);
