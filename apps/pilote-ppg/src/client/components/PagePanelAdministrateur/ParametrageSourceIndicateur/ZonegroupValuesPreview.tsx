import type { ZonegroupAdminListItem } from "@/server/referentiels/zonegroup/queries/ListZonegroupsAdminQuery";
import Link from "next/link";
import { Button } from "@/components/shared/Button";

export const ZonegroupValuesPreview = ({
  zonegroupsActifs,
}: {
  zonegroupsActifs: ZonegroupAdminListItem[];
}) => {
  return (
    <div className="fr-mt-2w">
      <p className="text-sm text-gray-600 mb-3">
        Les valeurs sélectionnables pour ce champ proviennent directement du
        référentiel des zone-groupes. Pour créer, modifier ou archiver un
        zone-groupe, rendez-vous sur le référentiel dédié.
      </p>
      {zonegroupsActifs.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-3">
          Aucun zone-groupe actif pour le moment.
        </p>
      ) : (
        <ul className="fr-mb-3w list-disc pl-5">
          {zonegroupsActifs.map((zonegroup) => (
            <li className="text-sm" key={zonegroup.zoneGroupId}>
              <span className="font-mono text-xs text-gray-400 mr-2">
                {zonegroup.zoneGroupId}
              </span>
              {zonegroup.zgName}
            </li>
          ))}
        </ul>
      )}
      <Button asChild variant="secondary">
        <Link href="/panel-administrateur/referentiels/zonegroups">
          Gérer les zone-groupes →
        </Link>
      </Button>
    </div>
  );
};
