import { Content } from "pdfmake/interfaces";
import { px, rem } from "@/server/pdf/units";
import { getListeTerritoires } from "@/client/constants/territoires";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographieSwatch } from "@/components/_commons/CartographieV2/LegendeCartographieSwatch";
import { CartographieDonnéesAvancement } from "@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface";
import { CartographieDonnéesMétéo } from "@/components/_commons/Cartographie/CartographieMétéo/CartographieMétéo.interface";
import { Remplissage } from "@/client/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { getAvancementFill } from "@/components/_commons/Cartographie/CartographieAvancement/avancementFill";
import { getMeteoFill } from "@/components/_commons/Cartographie/CartographieMétéo/meteoFill";
import { ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieAvancement";
import { ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS } from "@/client/constants/légendes/élémentsDeLégendesCartographieMétéo";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { renderSvg } from "@/server/pdf/svgFromComponent";
import { color } from "@/server/pdf/colors";

type Fills = Record<string, Remplissage>;

const DEFAULT_FILL = color("pilote-gris-moyen");

function carteSvg(params: {
  territoireCode: string;
  selectedMaille: MailleInterne;
  fills: Fills;
}): string {
  const donnees = Object.fromEntries(
    getListeTerritoires(params.selectedMaille).map((territoire) => [
      territoire.code,
      {
        remplissage: params.fills[territoire.code] ?? DEFAULT_FILL,
        libelle: territoire.nomAffiché,
      },
    ]),
  );
  return renderSvg(
    <CartographieV2
      donnees={donnees}
      maille={params.selectedMaille}
      territoiresSelectionnes={
        params.territoireCode === "NAT-FR" ? [] : [params.territoireCode]
      }
    />,
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
        getAvancementFill(
          donnée.valeurAnnuelle,
          ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS,
          donnée.estApplicable,
        ),
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
        getMeteoFill(
          donnée.valeur,
          ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS,
          donnée.estApplicable,
        ),
      ]),
    ),
  });
}

function swatchSvg(remplissage: Remplissage): string {
  return renderSvg(<LegendeCartographieSwatch remplissage={remplissage} />);
}

export function cartographieLegendPdf(
  entries: {
    libellé: string;
    remplissage: Remplissage;
    pictoSvg?: string | null;
  }[],
): Content {
  const SHORT_LABEL_LENGTH = 12;
  const SHORT_PER_ROW = 5;
  const groups: (typeof entries)[] = [];
  for (const entry of entries) {
    const current = groups.at(-1);
    const isShort =
      entry.libellé.length <= SHORT_LABEL_LENGTH && !entry.pictoSvg;
    if (
      isShort &&
      current &&
      current.length < SHORT_PER_ROW &&
      current.every((other) => other.libellé.length <= SHORT_LABEL_LENGTH)
    ) {
      current.push(entry);
    } else {
      groups.push([entry]);
    }
  }
  const rows: Content[] = groups.map((group) => ({
    columns: group.map((entry) => ({
      width: "auto",
      columns: [
        {
          svg: swatchSvg(entry.remplissage),
          width: rem(0.6),
          margin: [0, px(3), 0, 0],
        },
        {
          width: "auto",
          text: entry.libellé,
          fontSize: px(12),
          color: color("dsfr-mention-grey"),
        },
        ...(entry.pictoSvg ? [{ svg: entry.pictoSvg, width: px(24) }] : []),
      ],
      columnGap: px(6),
      margin: [0, 0, px(12), px(4)],
    })),
  }));
  return { stack: rows, margin: [0, px(8), 0, 0] };
}
