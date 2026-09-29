import type {
  PersonneAnnuaire,
  TerritoireAnnuaire,
} from "@/server/annuaire/queries/personnesAnnuaire";
import type { ChantierAnnuaire } from "@/server/annuaire/queries/ListerResponsablesAnnuaireQuery";
import { BadgeNiveau } from "./BadgeNiveau";
import { BlocPersonne } from "./BlocPersonne";
import { CelluleTerritoire } from "./CelluleTerritoire";

export function ListePersonnes({
  personnes,
}: {
  personnes: PersonneAnnuaire[];
}) {
  return (
    <ul className="!m-0 !p-0 list-none flex flex-col gap-3">
      {personnes.map((personne) => (
        <li className="!p-0" key={personne.id}>
          <BlocPersonne personne={personne} />
        </li>
      ))}
    </ul>
  );
}

export function ListeTerritoires({
  territoires,
}: {
  territoires: TerritoireAnnuaire[];
}) {
  return (
    <ul className="!m-0 !p-0 list-none flex flex-col gap-2">
      {territoires.map((territoire) => (
        <li className="!p-0 flex items-start gap-2" key={territoire.code}>
          <CelluleTerritoire territoire={territoire} />
          <BadgeNiveau maille={territoire.maille} />
        </li>
      ))}
    </ul>
  );
}

export function ListeAffectations({
  affectations,
}: {
  affectations: {
    chantier: ChantierAnnuaire;
    territoire: TerritoireAnnuaire;
  }[];
}) {
  return (
    <ul className="!m-0 !p-0 list-none flex flex-col gap-2">
      {affectations.map(({ chantier, territoire }) => (
        <li
          className="!p-0 flex flex-wrap items-center gap-2 text-sm"
          key={`${chantier.id}|${territoire.code}`}
        >
          <span className="font-medium">{chantier.nom}</span>
          <span className="text-dsfr-mention-grey">· {territoire.nom}</span>
          <BadgeNiveau maille={territoire.maille} />
        </li>
      ))}
    </ul>
  );
}
