import {
  Tableau,
  TableauCellule,
  TableauCelluleEnTete,
  TableauCorps,
  TableauEnTete,
  TableauLigne,
} from "@/components/shared/Tableau";
import api from "@/server/infrastructure/api/trpc/api";
import { type CompteActivite } from "@/server/rapports-hebdomadaires/domain/CompteActivite";

export const TableauUtilisateurs = ({
  comptes,
}: {
  comptes: CompteActivite[];
}) => {
  const [profils] = api.profil.récupérerTous.useSuspenseQuery();

  const profilParCode = new Map(
    profils.map((p: { code: string; nom: string }) => [p.code, p.nom]),
  );

  return (
    <div className="relative">
      <Tableau>
        <TableauEnTete className="bg-dsfr-blue-france-925">
          <tr>
            <TableauCelluleEnTete>Prénom</TableauCelluleEnTete>
            <TableauCelluleEnTete>Nom</TableauCelluleEnTete>
            <TableauCelluleEnTete>Email</TableauCelluleEnTete>
            <TableauCelluleEnTete>Profil</TableauCelluleEnTete>
          </tr>
        </TableauEnTete>
        <TableauCorps className="bg-transparent">
          {comptes.map((compte) => (
            <TableauLigne key={compte.email}>
              <TableauCellule>{compte.prenom}</TableauCellule>
              <TableauCellule>{compte.nom}</TableauCellule>
              <TableauCellule>{compte.email}</TableauCellule>
              <TableauCellule>
                {profilParCode.get(compte.profil) ?? compte.profil}
              </TableauCellule>
            </TableauLigne>
          ))}
        </TableauCorps>
      </Tableau>
    </div>
  );
};
