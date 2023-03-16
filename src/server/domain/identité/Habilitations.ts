type HabilitationsChantier = { [key: ChantierId]: string[] };

type ChantierId = string;

type Habilitations = {
  chantiers: HabilitationsChantier
};

export function habilitationsChantierIds(habilitations: Habilitations) {
  return Object.keys(habilitations.chantiers);
}

export function habilitationsPourChantierIds(...chantierIds: string[]) {
  const habilitationsChantier: HabilitationsChantier = {};
  for (const chantierId of chantierIds) {
    habilitationsChantier[chantierId] = ['read'];
  }
  return { chantiers: habilitationsChantier };
}

export default Habilitations;
