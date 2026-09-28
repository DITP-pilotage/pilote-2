import { FunctionComponent } from "react";
import { PictoTendance } from "@/components/_commons/PictoTendance/PictoTendance";
import { EcartTuileChantier } from "@/components/_commons/TexteColoré/EcartTuileChantier";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { clsxm } from "@/utils/clsxm";

const TableauChantiersTuileChantier: FunctionComponent<{
  chantier: DonnéesTableauChantiers;
  afficherIcône: boolean;
  chantiersSontArchives: boolean;
}> = ({ chantier, afficherIcône, chantiersSontArchives }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        {afficherIcône ? (
          <IconeMinistere
            className="shrink-0 w-5 h-5 mt-0.5 text-dsfr-blue-france-sun-113"
            icone={chantier.porteur?.icône}
          />
        ) : null}
        <span className="grow">{chantier.nom ?? undefined}</span>
        <div className="shrink-0 [&_svg]:w-5 [&_svg]:h-5">
          <TypologiesPictos typologies={chantier.typologie} />
        </div>
      </div>
      <div
        className={clsxm(
          "grid grid-cols-[3rem_minmax(0,12rem)_1.5rem_2.75rem] gap-x-4 items-start whitespace-nowrap [&>:first-child_svg]:w-8 [&>:first-child_svg]:h-8",
          afficherIcône && "pl-7",
        )}
      >
        <TableauRéformesMétéo
          chantiersSontArchives={chantiersSontArchives}
          dateDeMàjDonnéesQualitatives={chantier.dateDeMàjDonnéesQualitatives}
          météo={chantier.météo}
          taille="sm"
        />
        <TableauRéformesAvancement
          avancement={chantier.avancement}
          dateDeMàjDonnéesQuantitatives={chantier.dateDeMàjDonnéesQuantitatives}
          estArchive={chantiersSontArchives}
        />
        <div className="flex h-8 items-center">
          <PictoTendance
            estArchive={chantiersSontArchives}
            tendance={chantier.tendance}
          />
        </div>
        <div className="flex h-8 items-center">
          <EcartTuileChantier
            chantiersSontArchives={chantiersSontArchives}
            ecart={chantier.écart}
          />
        </div>
      </div>
    </div>
  );
};

export default TableauChantiersTuileChantier;
