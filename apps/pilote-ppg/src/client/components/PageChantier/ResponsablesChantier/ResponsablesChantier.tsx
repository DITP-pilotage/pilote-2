import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";
import ResponsablesLigneChantier from "@/components/_commons/ResponsablesLigneChantier/ResponsablesLigneChantier";
import { Maille } from "@/server/domain/maille/Maille.interface";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import {
  CoordinateurTerritorialRapportDetailleContrat,
  DirecteurProjetRapportDetailleContrat,
  ResponsableLocalRapportDetailleContrat,
} from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";

interface ResponsablesChantierProps {
  listeDirecteursProjets: DirecteurProjetRapportDetailleContrat[];
  listeResponsablesLocaux: ResponsableLocalRapportDetailleContrat[];
  listeCoordinateursTerritorials: CoordinateurTerritorialRapportDetailleContrat[];
  afficheResponsablesLocaux: boolean;
  estChantierArchive?: boolean;
  maille: Maille | null;
  libelléChantier: Chantier["nom"];
}

const adjectifReferent: Record<Maille, string> = {
  nationale: "national",
  departementale: "departemental",
  regionale: "regional",
};

const ResponsablesPageChantier: FunctionComponent<
  ResponsablesChantierProps
> = ({
  listeDirecteursProjets,
  listeResponsablesLocaux,
  listeCoordinateursTerritorials,
  afficheResponsablesLocaux,
  maille,
  estChantierArchive = false,
  libelléChantier,
}) => {
  const libelleEmailsDirecteursProjets = listeDirecteursProjets
    .map((d) => d.email)
    .filter(Boolean)
    .join("; ");
  const libelleEmailsResponsablesLocal = listeResponsablesLocaux
    .map((r) => r.email)
    .filter(Boolean)
    .join("; ");
  const libelleEmailsCoordinateursTerritorial = listeCoordinateursTerritorials
    .map((c) => c.email)
    .filter(Boolean)
    .join("; ");

  return (
    <Bloc
      backgroundClassNameTitre={
        estChantierArchive ? "bg-dsfr-grey-925" : "bg-dsfr-blue-france-925"
      }
      titre="National"
    >
      <ResponsablesLigneChantier
        libelleEmailsResponsables={libelleEmailsDirecteursProjets}
        responsables={listeDirecteursProjets}
        libellé="Directeur(s) / directrice(s) du projet"
        libelléChantier={libelléChantier}
      />
      {afficheResponsablesLocaux ? (
        <>
          <hr className="fr-hr fr-py-1w" />
          <ResponsablesLigneChantier
            libelleEmailsResponsables={libelleEmailsResponsablesLocal}
            responsables={listeResponsablesLocaux}
            libellé="Responsable local"
            libelléChantier={libelléChantier}
          />
          <hr className="fr-hr fr-py-1w" />
          <ResponsablesLigneChantier
            libelleEmailsResponsables={libelleEmailsCoordinateursTerritorial}
            responsables={listeCoordinateursTerritorials}
            libellé={`Coordinateur PILOTE ${maille ? adjectifReferent[maille] : ""}`}
            libelléChantier={libelléChantier}
          />
        </>
      ) : null}
    </Bloc>
  );
};

export default ResponsablesPageChantier;
