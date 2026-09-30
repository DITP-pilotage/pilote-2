import type { Session } from "next-auth";
import { createContext, FunctionComponent, ReactNode, useContext } from "react";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";
import type { ProfilUtilisateurViewModel } from "@/server/profil-utilisateur/queries/GetProfilUtilisateurQuery";

export interface Bootstrap {
  session: Session;
  variablesContenu: VariableContenuDisponibleEnv;
  utilisateurConnecte: ProfilUtilisateurViewModel;
}

const BootstrapContext = createContext<Partial<Bootstrap>>({});

export const BootstrapProvider: FunctionComponent<{
  value: Partial<Bootstrap>;
  children: ReactNode;
}> = ({ value, children }) => (
  <BootstrapContext.Provider value={value}>
    {children}
  </BootstrapContext.Provider>
);

/**
 * Données chargées par le `getServerSideProps` de la page, quand il les fournit.
 * Absentes sur les pages qui ne passent pas par `loadBootstrap` :
 * les hooks retombent alors sur leur requête tRPC.
 */
export const useBootstrap = (): Partial<Bootstrap> =>
  useContext(BootstrapContext);
