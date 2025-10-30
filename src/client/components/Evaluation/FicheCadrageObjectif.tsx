import { Objectif } from "@/server/evaluation/queries/types";

export const FicheCadrageObjectif = ({ objectif }: { objectif: Objectif }) => {
  return (
    <div>
      <h2 className="!text-xl">{objectif.libelle}</h2>

      <h3 className="!text-lg !mb-1">Descriptif</h3>
      <p className="whitespace-pre-line">{objectif.descriptif}</p>

      <h3 className="!text-lg !mb-1">Indicateur + cible</h3>
      <p className="whitespace-pre-line">{objectif.indicateurCible}</p>
    </div>
  );
};
