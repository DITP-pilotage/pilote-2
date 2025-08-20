import { formaterDate } from "@/client/utils/date/date";

export const ComparaisonValeurBox = ({
  titre,
  valeur,
  date,
}: {
  titre: string;
  valeur?: string | number;
  date: string | null;
}) => {
  return (
    <div className="w-half-full fr-mr-1w border flex flex-column">
      <span className="bold fr-background-action-low-blue-france flex justify-center fr-p-1w">
        {titre}
      </span>
      <div className="w-full flex flex-column justify-between fr-py-2w">
        <span className="fr-mb-2w text-center">{valeur}</span>
        <span className="flex justify-center align-end texte-gris">
          ({formaterDate(date, "MM/YYYY")})
        </span>
      </div>
    </div>
  );
};
