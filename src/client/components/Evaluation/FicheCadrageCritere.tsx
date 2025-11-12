import { Critere } from "@/server/evaluation/queries/types";

export const FicheCadrageCritere = ({ critere }: { critere: Critere }) => {
  return (
    <div>
      <h2 className="!text-xl">{critere.libelle}</h2>

      <p className="whitespace-pre-line">{critere.descriptif}</p>

      <ul className="list-style-none !p-0">
        {critere.sousCriteres.map((sousCritere) => (
          <li key={sousCritere.id}>
            <h3 className="!text-lg !mb-1">{sousCritere.libelle}</h3>
            <p className="whitespace-pre-line">{sousCritere.descriptif}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
