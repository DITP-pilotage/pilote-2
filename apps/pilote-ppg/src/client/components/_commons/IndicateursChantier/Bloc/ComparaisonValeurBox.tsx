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
    <div className="w-1/2 mr-2 border flex flex-col">
      <span className="font-bold bg-dsfr-blue-france-925 flex justify-center p-2">
        {titre}
        {indicateurId && proposition ? (
          <Infobulle classNameInfoBulle="tooltip-accordeon">
            <p className="text-sm print:text-base">
              Valeur d'avancement proposée le{" "}
              {formaterDate(proposition.dateProposition, "DD/MM/YYYY")} par{" "}
              {proposition.auteur}
            </p>
            <p className="text-sm print:text-base">
              <b>Motif de la proposition</b>
            </p>
            <p className="text-sm print:text-base">{proposition.motif}</p>
            <p className="text-sm print:text-base">
              <b>Source des données et méthode de calcul</b>
            </p>
            <p className="text-sm print:text-base mb-0">
              {proposition.sourceDonneeEtMethodeCalcul}
            </p>
          </Infobulle>
        ) : null}
      </span>
      <div className="w-full flex flex-col justify-between py-4">
        <span className="mb-4 text-center">{valeur}</span>
        <span className="flex justify-center items-end text-dsfr-mention-grey">
          ({formaterDate(date, "MM/YYYY")})
        </span>
      </div>
    </div>
  );
};
