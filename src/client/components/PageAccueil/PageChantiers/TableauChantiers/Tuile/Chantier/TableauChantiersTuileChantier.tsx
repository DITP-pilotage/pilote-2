import { FunctionComponent } from "react";
import { PictoTendance } from "@/components/_commons/PictoTendance/PictoTendance";
import { EcartTuileChantier } from "@/components/_commons/TexteColoré/EcartTuileChantier";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";

const TableauChantiersTuileChantier: FunctionComponent<{
  chantier: DonnéesTableauChantiers;
  afficherIcône: boolean;
  chantiersSontArchives: boolean;
}> = ({ chantier, afficherIcône, chantiersSontArchives }) => {
  return (
    <div>
      <div className="grid grid-cols-[auto_max-content]">
        <div className="fr-mb-0 fr-ml-n1w flex gap-2">
          {afficherIcône ? (
            <IconeMinistere
              className="text-dsfr-blue-france-sun-113"
              icone={chantier.porteur?.icône}
            />
          ) : null}
          {chantier.nom ?? undefined}
        </div>
        <TypologiesPictos typologies={chantier.typologie} />
      </div>
      <div className="fr-mt-1w fr-ml-5v grid grid-cols-[2.5rem_auto_1.5rem_2.75rem] gap-x-4 items-baseline whitespace-nowrap">
        <div className="flex self-start [&_.météo-picto]:max-w-full">
          <TableauRéformesMétéo
            chantiersSontArchives={chantiersSontArchives}
            dateDeMàjDonnéesQualitatives={chantier.dateDeMàjDonnéesQualitatives}
            météo={chantier.météo}
            taille="sm"
          />
        </div>
        <div className="grow max-w-48 h-8">
          <TableauRéformesAvancement
            avancement={chantier.avancement}
            dateDeMàjDonnéesQuantitatives={
              chantier.dateDeMàjDonnéesQuantitatives
            }
            estArchive={chantiersSontArchives}
          />
        </div>
        <PictoTendance
          estArchive={chantiersSontArchives}
          tendance={chantier.tendance}
        />
        <EcartTuileChantier
          chantiersSontArchives={chantiersSontArchives}
          ecart={chantier.écart}
        />
      </div>
    </div>
  );
};

export default TableauChantiersTuileChantier;
