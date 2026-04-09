import { FunctionComponent, ReactNode, useState } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { useEnv } from "@/client/hooks/useEnv";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { Filtres } from "@/components/PageAccueil/Filtres/Filtres";
import Titre from "@/components/_commons/Titre/Titre";
import { PanelMenuNavigation } from "@/components/_commons/PanelMenuNavigation/PanelMenuNavigation";
import { FiltresActifs } from "@/components/PageAccueil/FiltresActifs/FiltresActifs";
import { BoutonNavigationFicheTerritoriale } from "@/components/PageAccueil/BoutonNavigationFicheTerritoriale";
import { BoutonNavigationRapportDetaille } from "@/components/BoutonNavigationRapportDetaille";
import { BoutonExportDesDonnees } from "@/components/PageAccueil/BoutonExportDesDonnees";
import { BoutonSyntheseTerritoire } from "@/components/PageAccueil/BoutonSyntheseTerritoire";
import { ModaleVideoAccueil } from "@/components/PageAccueil/PageChantiers/ModaleVideoAccueil/ModaleVideoAccueil";
import { ModaleInscriptionInfolettre } from "@/components/PageAccueil/PageChantiers/ModaleInscriptionInfoLettre/ModaleInscriptionInfolettre";
import { ModaleRenseignerService } from "@/components/PageAccueil/PageChantiers/ModaleRenseignerService/ModaleRenseignerService";
import Axe from "@/server/domain/axe/Axe.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { profilsRégionaux } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { clsxm } from "@/utils/clsxm";

const PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set([
  ProfilEnum.CABINET_MTFP,
  ProfilEnum.PM_ET_CABINET,
  ProfilEnum.PR,
  ProfilEnum.CABINET_MINISTERIEL,
  ProfilEnum.DIR_ADMIN_CENTRALE,
  ProfilEnum.DROM,
  ProfilEnum.SECRETARIAT_GENERAL,
  ProfilEnum.DIR_PROJET,
  ProfilEnum.EQUIPE_DIR_PROJET,
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
  ProfilEnum.PREFET_REGION,
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.SERVICES_DECONCENTRES_REGION,
  ProfilEnum.RESPONSABLE_REGION,
]);

const PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE = new Set(
  profilsRégionaux,
);

const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
  ProfilEnum.RESPONSABLE_DEPARTEMENT,
]);

interface BasePageAccueilLayoutProps {
  axes: Axe[];
  ministères: Ministère[];
  territoireCode: string;
  mailleSelectionnee: MailleInterne;
  mailleQuery: MailleInterne;
  jalon: number;
  nombreTotalChantiersAvecAlertes: number;
  doitAfficherModaleVideoAccueil: boolean;
  doitAfficherLaModaleInfolettre: boolean;
  doitAfficherLaFicheTerritoriale: boolean;
  children: ReactNode;
}

export const BasePageAccueilLayout: FunctionComponent<
  BasePageAccueilLayoutProps
> = ({
  axes,
  ministères,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  jalon,
  nombreTotalChantiersAvecAlertes,
  doitAfficherModaleVideoAccueil: doitAfficherModaleVideoAccueilInitial,
  doitAfficherLaModaleInfolettre: doitAfficherLaModaleInfolettreInitial,
  doitAfficherLaFicheTerritoriale,
  children,
}) => {
  const { data: session } = useSession();
  const profil = useProfilUtilisateurConnecte();
  const monProfilEstDisponible = useEnv("NEXT_PUBLIC_FF_MON_PROFIL");
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");

  const estProfilTerritorialise =
    PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(session?.profil || "");
  const estProfilRegionalAutoriseAVoirLaTerritorialisation =
    PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(
      session?.profil || "",
    );
  const estAutoriseAVoirLeSelecteurDeMaille =
    !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(session?.profil || "");

  const doitAfficherModaleRenseignerService =
    !!monProfilEstDisponible &&
    (profil.service == null || profil.fonction == null);

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [isModaleInfolettreOpen, setIsModaleInfolettreOpen] = useState(
    doitAfficherLaModaleInfolettreInitial,
  );
  const [isModaleVideoAccueilOpen, setIsModaleVideoAccueilOpen] = useState(
    doitAfficherModaleVideoAccueilInitial,
  );
  const [isModaleRenseignerServiceOpen, setIsModaleRenseignerServiceOpen] =
    useState(doitAfficherModaleRenseignerService);

  const filtresStatut = useQueryState(
    "statut",
    parseAsStringLiteral([
      "BROUILLON",
      "PUBLIE",
      "BROUILLON_ET_PUBLIE",
      "ARCHIVE",
    ]),
  );
  const chantiersSontArchives = filtresStatut?.includes("ARCHIVE") ?? false;

  const pathname = "/accueil/chantier/[territoireCode]";

  return (
    <div className="[&_.fr-h2]:!text-[1.875rem] [&_.fr-h2]:!leading-9">
      <Head>
        <title>PILOTE - Piloter l'action publique par les résultats</title>
      </Head>
      <div className="flex">
        <BarreLatérale
          estOuvert={estOuverteBarreLatérale}
          setEstOuvert={setEstOuverteBarreLatérale}
        >
          <BarreLatéraleEncart>
            <Titre
              baliseHtml="h1"
              className={clsxm(
                `fr-h2 fr-p-0 fr-mb-3w`,
                chantiersSontArchives
                  ? "titre-gris"
                  : "fr-text-title--blue-france",
              )}
            >
              {`${nombreTotalChantiersAvecAlertes} ${nombreTotalChantiersAvecAlertes >= 2 ? "chantiers" : "chantier"}`}
            </Titre>
            <div className="inline-flex flex-col gap-1">
              {doitAfficherLaFicheTerritoriale &&
              estAutoriséAConsulterLaFicheTerritoriale(
                session?.profil || "",
              ) ? (
                <BoutonNavigationFicheTerritoriale
                  jalon={jalon}
                  territoireCode={territoireCode}
                />
              ) : null}
              <BoutonNavigationRapportDetaille
                territoireCode={territoireCode}
              />
              <BoutonExportDesDonnees territoireCode={territoireCode} />
            </div>
          </BarreLatéraleEncart>
          <section>
            <Filtres
              afficherToutLesFiltres
              axes={axes}
              estProfilRegionalAutoriseAVoirLaTerritorialisation={
                estProfilRegionalAutoriseAVoirLaTerritorialisation
              }
              estProfilTerritorialise={estProfilTerritorialise}
              ministères={ministères}
            />
          </section>
        </BarreLatérale>
        <div className="w-full">
          <div className="sticky top-0 z-[1] w-full shadow-[0_6px_18px_var(--shadow-color)] bg-dsfr-blue-france-850 fr-grid-row fr-pt-2w">
            <PanelMenuNavigation
              estAutoriseAVoirLeSelecteurDeMaille={
                estAutoriseAVoirLeSelecteurDeMaille
              }
              mailleQuery={mailleQuery}
              pathname={pathname}
              setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
              territoireCode={territoireCode}
            />
            <FiltresActifs
              axes={axes}
              mailleSelectionnee={mailleSelectionnee}
              ministères={ministères}
            />
            {ffAskAI || session?.profil === ProfilEnum.DITP_ADMIN ? (
              <BoutonSyntheseTerritoire
                jalon={jalon}
                territoireCode={territoireCode}
              />
            ) : null}
          </div>
          {children}
          <ModaleVideoAccueil
            onOpenChange={setIsModaleVideoAccueilOpen}
            open={isModaleVideoAccueilOpen}
          />
          <ModaleRenseignerService
            onOpenChange={setIsModaleRenseignerServiceOpen}
            open={!isModaleVideoAccueilOpen && isModaleRenseignerServiceOpen}
          />
          <ModaleInscriptionInfolettre
            onOpenChange={setIsModaleInfolettreOpen}
            open={
              !isModaleVideoAccueilOpen &&
              !isModaleRenseignerServiceOpen &&
              isModaleInfolettreOpen
            }
          />
        </div>
      </div>
    </div>
  );
};
