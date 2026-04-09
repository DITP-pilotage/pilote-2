import { useState } from "react";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useProfilUtilisateurConnecte } from "@/client/hooks/useProfilUtilisateurConnecte";
import { useEnv } from "@/client/hooks/useEnv";
import PageChantiers from "@/components/PageAccueil/PageChantiers/PageChantiers";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { Filtres } from "@/components/PageAccueil/Filtres/Filtres";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import Titre from "@/components/_commons/Titre/Titre";
import { estAutoriséAConsulterLaFicheTerritoriale } from "@/client/utils/fiche-territoriale/fiche-territoriale";
import { PanelMenuNavigation } from "@/components/_commons/PanelMenuNavigation/PanelMenuNavigation";
import { FiltresActifs } from "@/components/PageAccueil/FiltresActifs/FiltresActifs";
import { ModaleInscriptionInfolettre } from "@/components/PageAccueil/PageChantiers/ModaleInscriptionInfoLettre/ModaleInscriptionInfolettre";
import { ModaleRenseignerService } from "@/components/PageAccueil/PageChantiers/ModaleRenseignerService/ModaleRenseignerService";
import { BoutonNavigationFicheTerritoriale } from "@/components/PageAccueil/BoutonNavigationFicheTerritoriale";
import { BoutonNavigationRapportDetaille } from "@/components/BoutonNavigationRapportDetaille";
import { BoutonSyntheseTerritoire } from "@/components/PageAccueil/BoutonSyntheseTerritoire";
import { BoutonExportDesDonnees } from "@/components/PageAccueil/BoutonExportDesDonnees";
import { clsxm } from "@/utils/clsxm";
import { ModaleVideoAccueil } from "@/components/PageAccueil/PageChantiers/ModaleVideoAccueil/ModaleVideoAccueil";
import { profilsRégionaux } from "@/server/gestion-utilisateur/domain/Utilisateur.interface";
import type { getServerSideProps } from "@/pages/accueil/chantier/[territoireCode]/index";

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

export const PageAccueilLegacy = ({
  chantiers,
  chantierIds,
  chantierIdsSansFiltrageAlertes,
  nombreTotalChantiersAvecAlertes,
  axes,
  ministères,
  territoireCode,
  mailleSelectionnee,
  mailleQuery,
  filtresComptesCalculés,
  avancementsAgrégés,
  avancementsGlobauxTerritoriauxMoyens,
  repartitionMeteosChantiers,
  jalon,
  jalonParDefaut,
  doitAfficherModaleVideoAccueil,
  doitAfficherLaModaleInfolettre,
  doitAfficherLaFicheTerritoriale,
  moyenneTerritoire,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: session } = useSession();

  const estProfilTerritorialise =
    PROFIL_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(session?.profil || "");
  const estProfilRegionalAutoriseAVoirLaTerritorialisation =
    PROFIL_REGIONAUX_AUTORISE_A_VOIR_FILTRE_TERRITORIALISE.has(
      session?.profil || "",
    );

  const profil = useProfilUtilisateurConnecte();
  const monProfilEstDisponible = useEnv("NEXT_PUBLIC_FF_MON_PROFIL");
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
  const doitAfficherModaleRenseignerService =
    !!monProfilEstDisponible &&
    (profil.service == null || profil.fonction == null);

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [isModaleInfolettreOpen, setIsModaleInfolettreOpen] = useState(
    doitAfficherLaModaleInfolettre,
  );
  const [isModaleVideoAccueilOpen, setIsModaleVideoAccueilOpen] = useState(
    doitAfficherModaleVideoAccueil,
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
  const PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE = new Set([
    ProfilEnum.COORDINATEUR_DEPARTEMENT,
    ProfilEnum.RESPONSABLE_DEPARTEMENT,
  ]);
  const estAutoriseAVoirLeSelecteurDeMaille =
    !PROFIL_INTERDIT_DE_VOIR_LE_SELECTEUR_DE_MAILLE.has(session?.profil || "");

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
            <div className="inline-flex flex-column gap-1">
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
                territoireCode={territoireCode}
                jalon={jalon}
              />
            ) : null}
          </div>
          <PageChantiers
            avancementsAgrégés={avancementsAgrégés}
            avancementsGlobauxTerritoriauxMoyens={
              avancementsGlobauxTerritoriauxMoyens
            }
            chantierIds={chantierIds}
            chantierIdsSansFiltrageAlertes={chantierIdsSansFiltrageAlertes}
            chantiers={chantiers}
            filtresComptesCalculés={filtresComptesCalculés}
            jalon={jalon}
            jalonParDefaut={jalonParDefaut}
            mailleQuery={mailleQuery}
            ministères={ministères}
            nombreTotalChantiersAvecAlertes={nombreTotalChantiersAvecAlertes}
            repartitionMeteosChantiers={repartitionMeteosChantiers}
            territoireCode={territoireCode}
            moyenneTerritoire={moyenneTerritoire}
          />
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
