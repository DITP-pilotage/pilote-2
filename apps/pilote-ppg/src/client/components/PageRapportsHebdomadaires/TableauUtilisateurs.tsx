import { Table } from "@/components/shared/Table";
import { api } from "@/server/framework/trpc/api";
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
    <Table.Root
      caption="Utilisateurs concernés par le rapport"
      captionHidden
      containerClassName="mb-0 pt-0"
    >
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Prénom</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body className="bg-transparent">
        {comptes.map((compte) => (
          <Table.Row key={compte.email}>
            <Table.Cell>{compte.prenom}</Table.Cell>
            <Table.Cell>{compte.nom}</Table.Cell>
            <Table.Cell>{compte.email}</Table.Cell>
            <Table.Cell>
              {profilParCode.get(compte.profil) ?? compte.profil}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
