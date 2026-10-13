import { ReactNode } from "react";
import { formaterDate } from "@/client/utils/date/date";
import { Infobulle } from "@/components/shared/Infobulle";
import { DetailIndicateurPropositionValeurAvancement } from "@/server/chantiers/domain/DetailsIndicateurs";

export const ComparaisonValeurBox = ({
  titre,
  valeur,
  date,
  indicateurId,
  proposition,
}: {
  titre: ReactNode;
  valeur?: string | number;
  date: string | null;
  indicateurId?: string;
  proposition?: DetailIndicateurPropositionValeurAvancement | null;
}) => {
  return (
    <div className="w-1/2 fr-mr-1w border flex flex-col">
      <span className="font-bold fr-background-action-low-blue-france flex justify-center fr-p-1w">
        {titre}
        {indicateurId && proposition ? (
          <Infobulle classNameInfoBulle="tooltip-accordeon">
            <p className="fr-text--sm texte-proposition">
              Valeur d'avancement proposée le{" "}
              {formaterDate(proposition.dateProposition, "DD/MM/YYYY")} par{" "}
              {proposition.auteur}
            </p>
            <p className="fr-text--sm">
              <b>Motif de la proposition</b>
            </p>
            <p className="fr-text--sm">{proposition.motif}</p>
            <p className="fr-text--sm">
              <b>Source des données et méthode de calcul</b>
            </p>
            <p className="fr-text--sm fr-mb-0">
              {proposition.sourceDonneeEtMethodeCalcul}
            </p>
          </Infobulle>
        ) : null}
      </span>
      <div className="w-full flex flex-col justify-between fr-py-2w">
        <span className="fr-mb-2w text-center">{valeur}</span>
        <span className="flex justify-center items-end !text-dsfr-mention-grey">
          ({formaterDate(date, "MM/YYYY")})
        </span>
      </div>
    </div>
  );
};
