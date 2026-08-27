import { InformationMetadataIndicateur } from "@/server/parametrage-indicateur/domain/InformationMetadataIndicateur";
import { AcceptedValue } from "@/server/parametrage-indicateur/domain/AcceptedValue";
import type { Inject } from "@/server/parametrage-indicateur/module";

const NOM_CHAMP_ZONE_GROUPE = "zg_applicable";

type ZonegroupActif = {
  zone_group_id: string;
  zg_name: string;
  zg_desc: string | null;
};

export default class RécupérerInformationMetadataIndicateurUseCase {
  constructor(private readonly dependencies: Inject<"prisma">) {}

  async run(): Promise<InformationMetadataIndicateur[]> {
    return this.récupérerDepuisBDD();
  }

  private async récupérerDepuisBDD(): Promise<InformationMetadataIndicateur[]> {
    const prisma = this.dependencies.prisma.getInstance();
    const [metadataFromDB, zonegroupsActifs] = await Promise.all([
      prisma.metadata_indicateur.findMany({
        include: {
          valeurs_acceptees: {
            orderBy: {
              ordre: "asc",
            },
          },
        },
      }),
      prisma.metadata_zonegroup.findMany({
        where: { deleted_at: null },
        orderBy: { zone_group_id: "asc" },
        select: { zone_group_id: true, zg_name: true, zg_desc: true },
      }),
    ]);

    return metadataFromDB.map((metadata) =>
      this.mapperDepuisBDD(metadata, zonegroupsActifs),
    );
  }

  private mapperDepuisBDD(
    metadata: {
      name: string;
      data_type: string;
      description: string;
      est_visible: boolean;
      alias: string;
      est_editable: boolean;
      validation_regex: string;
      validation_regex_error_message: string | null;
      edit_box_type: string | null;
      default_value: string | null;
      est_obligatoire: boolean;
      doit_afficher_la_description: boolean;
      valeurs_acceptees: {
        ordre: number;
        valeur: string;
        nom: string;
        description: string;
      }[];
    },
    zonegroupsActifs: ZonegroupActif[],
  ): InformationMetadataIndicateur {
    const defaultValue = this.convertirDefaultValue(
      metadata.default_value,
      metadata.data_type,
    );

    const acceptedValues =
      metadata.name === NOM_CHAMP_ZONE_GROUPE
        ? this.construireAcceptedValuesDepuisZonegroups(zonegroupsActifs)
        : metadata.valeurs_acceptees.map((valeur) =>
            AcceptedValue.créerAcceptedValue({
              orderId: valeur.ordre,
              value: valeur.valeur,
              name: valeur.nom,
              desc: valeur.description,
            }),
          );

    return InformationMetadataIndicateur.creerInformationMetadataIndicateur({
      name: metadata.name,
      dataType: metadata.data_type as "text" | "boolean",
      description: metadata.description,
      metaPiloteShow: metadata.est_visible,
      metaPiloteAlias: metadata.alias,
      metaPiloteEditIsEditable: metadata.est_editable,
      metaPiloteEditRegex: metadata.validation_regex,
      metaPiloteEditRegexViolationMessage:
        metadata.validation_regex_error_message,
      metaPiloteEditBoxType: (metadata.edit_box_type || "text") as
        "text" | "textarea" | "boolean" | "multi-select",
      metaPiloteDefaultValue: defaultValue,
      metaPiloteMandatory: metadata.est_obligatoire,
      metaPiloteDispDispDesc: metadata.doit_afficher_la_description,
      acceptedValues,
    });
  }

  private construireAcceptedValuesDepuisZonegroups(
    zonegroupsActifs: ZonegroupActif[],
  ): AcceptedValue[] {
    return zonegroupsActifs.map((zonegroup, index) =>
      AcceptedValue.créerAcceptedValue({
        orderId: index + 1,
        value: zonegroup.zone_group_id,
        name: zonegroup.zg_name,
        desc: zonegroup.zg_desc ?? "",
      }),
    );
  }

  private convertirDefaultValue(
    value: string | null,
    dataType: string,
  ): string | number | boolean | null {
    if (value === null) {
      return null;
    }

    if (dataType === "boolean") {
      return value === "true";
    }

    if (dataType === "number") {
      return Number(value);
    }

    return value;
  }
}
