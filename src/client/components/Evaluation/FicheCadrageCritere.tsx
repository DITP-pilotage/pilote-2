import { Critere } from "@/server/evaluation/queries/types";

export const FicheCadrageCritere = ({ critere }: { critere: Critere }) => {
  return (
    <div>
      <h2 className="!text-xl !text-primary">{critere.libelle}</h2>

      <p className="whitespace-pre-line !text-sm">{critere.descriptif}</p>

      <ul className="list-style-none !p-0">
        {critere.sousCriteres.map((sousCritere) => (
          <li key={sousCritere.id}>
            <h3 className="!text-base !mb-1 italic">{sousCritere.libelle}</h3>
            <p className="whitespace-pre-line !text-sm">
              {sousCritere.descriptif}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
