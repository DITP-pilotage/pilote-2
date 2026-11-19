import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { récupérerUnCookie } from "@/client/utils/cookies";
import { Checkbox } from "@/components/shared/Checkbox";
import { Notice } from "@/components/shared/Notice";
import { Table } from "@/components/shared/Table";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

export const ProfilsMatrice = () => {
  const utils = api.useUtils();
  const { data: matrice } = api.formation.matriceProfils.useQuery();
  const setMotifProfil = api.formation.setMotifProfil.useMutation({
    onSuccess: async (_, { propose, profilCode }) => {
      await utils.formation.matriceProfils.invalidate();
      const profil = matrice?.profils.find(
        (candidat) => candidat.code === profilCode,
      );
      toast.success(
        propose
          ? `Formation proposée au profil ${profil?.nom ?? profilCode}`
          : `Formation retirée du profil ${profil?.nom ?? profilCode}`,
        TOAST_OPTIONS,
      );
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  if (!matrice) return null;

  if (matrice.motifs.length === 0) {
    return (
      <Notice containerClassName="px-4" variant="info">
        Aucune formation importée depuis RDV-SP pour l'instant.
      </Notice>
    );
  }

  const associations = new Set(
    matrice.associations.map(
      (association) => `${association.motifId}|${association.profilCode}`,
    ),
  );

  return (
    <div className="overflow-x-auto">
      <Table caption="Formations proposées par profil" captionHidden>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
            {matrice.motifs.map((motif) => (
              <Table.ColumnHeaderCell key={motif.id}>
                {motif.nom}
              </Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {matrice.profils.map((profil) => (
            <Table.Row key={profil.code}>
              <Table.RowHeaderCell>{profil.nom}</Table.RowHeaderCell>
              {matrice.motifs.map((motif) => (
                <Table.Cell key={motif.id}>
                  <Checkbox
                    aria-label={`Proposer « ${motif.nom} » au profil ${profil.nom}`}
                    checked={associations.has(`${motif.id}|${profil.code}`)}
                    onCheckedChange={(etat) =>
                      setMotifProfil.mutate({
                        motifId: motif.id,
                        profilCode: profil.code,
                        propose: etat === true,
                        csrf: récupérerUnCookie("csrf") ?? "",
                      })
                    }
                  />
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
