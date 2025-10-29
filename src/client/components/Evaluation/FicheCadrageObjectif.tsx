import { Objectif } from "@/server/evaluation/queries/types";

export const FicheCadrageObjectif = ({ objectif }: { objectif: Objectif }) => {
  return (
    <div>
      <h2 className="!text-xl">{objectif.libelle}</h2>

      <p className="whitespace-pre-line">{objectif.descriptif}</p>
    </div>
  );
};
