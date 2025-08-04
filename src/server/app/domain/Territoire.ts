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
