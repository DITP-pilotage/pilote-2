type Habilitation = {
    chantiers: HabilitationChantier
  };
  
  export default Habilitation;
  
  type HabilitationChantier = { [key: ChantierId]: string[] };
  
  type ChantierListe = string[];

  type ChantierId = string;
  
  export function habilitationGetChantierIds(habilitations: Habilitation) : ChantierListe {
    return Object.keys(habilitations.chantiers);
  }


  export function habilitationGetChantierIdsAvecScope(habilitations: Habilitation, scope: String) {
    let habilitationChantier = habilitations.chantiers
    var chantierAvecScope = []
    for (const [key, value] of Object.entries(habilitationChantier)) {
        if (value.find(elt => elt == scope)) {
            chantierAvecScope.push(key)
        }
      }
    return chantierAvecScope;
  }
  
  export function habilitationPourChantierIds(...chantierIds: string[]) {
    const habilitationChantier: HabilitationChantier = {};
    for (const chantierId of chantierIds) {
      habilitationChantier[chantierId] = ['read'];
    }
    return { chantiers: habilitationChantier };
  }