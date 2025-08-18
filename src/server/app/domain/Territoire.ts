export class ConversionZoneIdError extends Error {
  constructor(zoneId: string) {
    super(
      `Zone ID invalide: ${zoneId}. Les formats acceptés sont: 'France', 'D<nombre>', 'R<nombre>'`,
    );
    this.name = "ConversionZoneIdError";
  }
}

export function convertirZoneIdEnTerritoireCode(zoneId: string): string {
  if (!zoneId) {
    throw new ConversionZoneIdError(zoneId);
  }

  const zoneIdTrimmed = zoneId.trim();
  const zoneIdUpper = zoneIdTrimmed.toUpperCase();

  if (zoneIdTrimmed.toLowerCase() === "france") {
    return "NAT-FR";
  }

  if (zoneIdUpper.startsWith("D")) {
    const departementCode = zoneIdUpper.slice(1);
    if (!departementCode || !/^\d+$/.test(departementCode)) {
      throw new ConversionZoneIdError(zoneId);
    }
    return `DEPT-${departementCode}`;
  }

  if (zoneIdUpper.startsWith("R")) {
    const regionCode = zoneIdUpper.slice(1);
    if (!regionCode || !/^\d+$/.test(regionCode)) {
      throw new ConversionZoneIdError(zoneId);
    }
    return `REG-${regionCode}`;
  }

  throw new ConversionZoneIdError(zoneId);
}

export function convertirTerritoireCodeEnZoneId(
  territoireCode: string,
): string {
  if (!territoireCode) {
    throw new ConversionZoneIdError(territoireCode);
  }

  const territoireCodeTrimmed = territoireCode.trim();
  const territoireCodeUpper = territoireCodeTrimmed.toUpperCase();

  if (territoireCodeUpper === "NAT-FR") {
    return "France";
  }

  if (territoireCodeUpper.startsWith("DEPT-")) {
    const departementCode = territoireCodeUpper.slice(5);
    if (!departementCode || !/^\d+$/.test(departementCode)) {
      throw new ConversionZoneIdError(territoireCode);
    }
    return `D${departementCode}`;
  }

  if (territoireCodeUpper.startsWith("REG-")) {
    const regionCode = territoireCodeUpper.slice(4);
    if (!regionCode || !/^\d+$/.test(regionCode)) {
      throw new ConversionZoneIdError(territoireCode);
    }
    return `R${regionCode}`;
  }

  throw new ConversionZoneIdError(territoireCode);
}
