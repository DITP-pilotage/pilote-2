type Habilitation = {
  chantiers: HabilitationChantier
};

export default Habilitation;

type HabilitationChantier = { [key: ChantierId]: string[] };

type ChantierId = string;

export function habilitationGetChantierIds(habilitations: Habilitation) {
  return Object.keys(habilitations.chantiers);
}

export function habilitationPourChantierIds(...chantierIds: string[]) {
  const habilitationChantier: HabilitationChantier = {};
  for (const chantierId of chantierIds) {
    habilitationChantier[chantierId] = ['read'];
  }
  return { chantiers: habilitationChantier };
}
