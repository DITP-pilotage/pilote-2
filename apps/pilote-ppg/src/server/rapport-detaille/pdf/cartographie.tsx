import { renderToStaticMarkup } from "react-dom/server";
import { territoires as allTerritoires } from "@/client/constants/territoires.json";
import { CartographieSVG } from "@/components/_commons/Cartographie/SVG/CartographieSVG";
import { getTraceSvg } from "@/components/_commons/Cartographie/SVG/CartographieSVGContrat";
import { CartographieTerritoires } from "@/components/_commons/Cartographie/useCartographie.interface";
import { CartographieDonnéesAvancement } from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { Remplissage } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { getAvancementFill } from "@/components/_commons/Cartographie/CartographieAvancement/avancementFill";
import { getMeteoFill } from "@/components/_commons/Cartographie/CartographieMétéo/meteoFill";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { flattenSvgClasses, renderSvg } from "@/server/pdf/svgFromComponent";

type Fills = Record<
  string,
  { remplissage: Remplissage; estApplicable: boolean | null }
>;

const DEFAULT_FILL = "#bababa";
const SELECTED_TERRITOIRE_CLASSES =
  "fill-none stroke-dsfr-moutarde-main-850 [stroke-width:0.5]";

export function buildCartographieTerritoires(
  selectedMaille: MailleInterne,
  fills: Fills,
): CartographieTerritoires {
  const régions = allTerritoires.filter(
    (territoire) => territoire.maille === "regionale",
  );
  const territoiresToDraw =
    selectedMaille === "departementale"
      ? allTerritoires.filter(
          (territoire) => territoire.maille === "departementale",
        )
      : régions;
  const frontières = selectedMaille === "departementale" ? régions : [];

  return {
    territoires: territoiresToDraw.map((territoire) => ({
      codeInsee: territoire.codeInsee,
      code: territoire.code,
      remplissage: fills[territoire.code]?.remplissage ?? DEFAULT_FILL,
      libellé: territoire.nomAffiché,
      contenuInfoBulle: null,
      estInteractif: false,
      estApplicable: fills[territoire.code]?.estApplicable ?? null,
    })),
    frontières: frontières.map((frontière) => ({
      codeInsee: frontière.codeInsee,
      code: frontière.code,
    })),
  };
}

function selectedTerritoireOutline(
  territoireCode: string,
  selectedMaille: MailleInterne,
): string {
  if (territoireCode === "NAT-FR") return "";
  const trace = getTraceSvg(
    territoireCode,
    { key: territoireCode, className: SELECTED_TERRITOIRE_CLASSES },
    selectedMaille,
  );
  return trace ? flattenSvgClasses(renderToStaticMarkup(<g>{trace}</g>)) : "";
}

function carteSvg(params: {
  territoireCode: string;
  selectedMaille: MailleInterne;
  fills: Fills;
}): string {
  const { territoires, frontières } = buildCartographieTerritoires(
    params.selectedMaille,
    params.fills,
  );
  const svg = renderSvg(
    <CartographieSVG
      auClicTerritoireCallback={() => {}}
      frontières={frontières}
      mailleSelectionnee={params.selectedMaille}
      options={{
        territoireAffiché: { codeInsee: "FR", maille: "nationale" },
        territoireSélectionnable: false,
        multiséléction: false,
        estInteractif: false,
      }}
      territoireCode={params.territoireCode}
      territoires={territoires}
    />,
  );
  return svg
    .replace("<svg", '<svg stroke="#FFFFFF"')
    .replace(
      /<\/g><\/svg>$/,
      `${selectedTerritoireOutline(params.territoireCode, params.selectedMaille)}</g></svg>`,
    );
}

export function avancementCarteSvg(params: {
  territoireCode: string;
  selectedMaille: MailleInterne;
  données: CartographieDonnéesAvancement;
}): string {
  return carteSvg({
    territoireCode: params.territoireCode,
    selectedMaille: params.selectedMaille,
    fills: Object.fromEntries(
      params.données.map((donnée) => [
        donnée.territoireCode,
        {
          remplissage: getAvancementFill(
            donnée.valeurAnnuelle,
            ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
            donnée.estApplicable,
          ),
          estApplicable: donnée.estApplicable,
        },
      ]),
    ),
  });
}

export function meteoCarteSvg(params: {
  territoireCode: string;
  selectedMaille: MailleInterne;
  données: CartographieDonnéesMétéo;
}): string {
  return carteSvg({
    territoireCode: params.territoireCode,
    selectedMaille: params.selectedMaille,
    fills: Object.fromEntries(
      params.données.map((donnée) => [
        donnée.territoireCode,
        {
          remplissage: getMeteoFill(
            donnée.valeur,
            ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
            donnée.estApplicable,
          ),
          estApplicable: donnée.estApplicable,
        },
      ]),
    ),
  });
}
