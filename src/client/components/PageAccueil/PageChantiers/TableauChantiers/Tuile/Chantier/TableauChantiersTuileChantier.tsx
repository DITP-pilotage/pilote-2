import { FunctionComponent } from "react";
import { PictoTendance } from "@/components/_commons/PictoTendance/PictoTendance";
import TexteColoré from "@/components/_commons/TexteColoré/TexteColoré";
import { definirCouleurEcartArrondi } from "@/client/utils/chantier/écart/écart";
import TableauRéformesAvancement from "@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement";
import TableauRéformesMétéo from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo";
import TypologiesPictos from "@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos";
import TableauChantiersTuileChantierStyled from "@/components/PageAccueil/PageChantiers/TableauChantiers/Tuile/Chantier/TableauChantiersTuileChantier.styled";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";

const TableauChantiersTuileChantier: FunctionComponent<{
  chantier: DonnéesTableauChantiers;
  afficherIcône: boolean;
  chantiersSontArchives: boolean;
}> = ({ chantier, afficherIcône, chantiersSontArchives }) => {
  const couleurEcartArrondi = definirCouleurEcartArrondi(
    chantier.écart,
    chantiersSontArchives,
  );

  return (
    <TableauChantiersTuileChantierStyled>
      <div className="tuile-chantier-entête">
        <div className="fr-mb-0 fr-ml-n1w">
          <div className="flex gap-2">
            {afficherIcône ? (
              <div>
                <IconeMinistere
                  className="text-dsfr-blue-france-sun-113"
                  icone={chantier.porteur?.icône}
                />
              </div>
            ) : null}
            {chantier.porteur?.nom ?? undefined}
          </div>
        </div>
        <div className="fr-ml-2w">
          <TypologiesPictos typologies={chantier.typologie} />
        </div>
      </div>
      <div className="fr-mt-1w fr-ml-5v tuile-chantier-corps">
        <div className="météo">
          <TableauRéformesMétéo
            chantiersSontArchives={chantiersSontArchives}
            dateDeMàjDonnéesQualitatives={chantier.dateDeMàjDonnéesQualitatives}
            météo={chantier.météo}
            taille="sm"
          />
        </div>
        <div className="avancement">
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
        {couleurEcartArrondi ? (
          <TexteColoré
            alignement="droite"
            couleur={couleurEcartArrondi.couleur}
            estGras
            texte={`${couleurEcartArrondi.ecartArrondi.toFixed(1)}`}
          />
        ) : null}
      </div>
    </TableauChantiersTuileChantierStyled>
  );
};

export default TableauChantiersTuileChantier;
