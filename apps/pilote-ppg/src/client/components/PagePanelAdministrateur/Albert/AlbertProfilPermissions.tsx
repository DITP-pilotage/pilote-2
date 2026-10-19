import { toast } from "sonner";
import { api } from "@/server/framework/trpc/api";
import { Notice } from "@/components/shared/Notice";
import { Switch } from "@/components/shared/Switch";
import { Table } from "@/components/shared/Table";

const TOAST_OPTIONS = {
  duration: 3000,
  position: "top-right",
  richColors: true,
} as const;

export const AlbertProfilPermissions = () => {
  const utils = api.useUtils();
  const { data: profils = [] } = api.albertAccess.listProfils.useQuery();
  const setProfilActive = api.albertAccess.setProfilActive.useMutation({
    onSuccess: async (_, { active }) => {
      await Promise.all([
        utils.albertAccess.listProfils.invalidate(),
        utils.albertAccess.listUtilisateurs.invalidate(),
      ]);
      toast.success(active ? "Accès activé" : "Accès désactivé", TOAST_OPTIONS);
    },
    onError: (error) => toast.error(error.message, TOAST_OPTIONS),
  });

  return (
    <div className="flex flex-col gap-6">
      <Notice containerClassName="px-4" variant="info">
        Les administrateurs DITP ont toujours accès à l'assistant IA.
      </Notice>
      <Table caption="Accès à l'assistant IA par profil" captionHidden>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Profil</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Accès</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {profils.map((profil) => (
            <Table.Row key={profil.code}>
              <Table.Cell>{profil.nom}</Table.Cell>
              <Table.Cell>
                <Switch.Root
                  aria-label={`Accès à l'assistant IA pour le profil ${profil.nom}`}
                  checked={profil.active}
                  disabled={setProfilActive.isPending}
                  onCheckedChange={(active) =>
                    setProfilActive.mutate({ profilCode: profil.code, active })
                  }
                >
                  <Switch.Thumb disabled={setProfilActive.isPending} />
                </Switch.Root>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
