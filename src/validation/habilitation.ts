import { z } from 'zod';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';

export default function créerValidateurHabilitations(territoires: Territoire[], chantiers: ChantierSynthétisé[]) {
  const validationTerritoiresProfilsRégionaux = z.string().array().refine(codes => {
    for (const code of codes) {
      if (!(code.startsWith('REG') || code.startsWith('DEPT'))) {  
        return false;
      }

      if (code.startsWith('REG')) {
        const départementsEnfants = territoires.filter(territoire => territoire.codeParent === code);
        const tousLesDépartementsEnfantsSontPrésents = départementsEnfants.every(département => codes.includes(département.code));
        
        if (!tousLesDépartementsEnfantsSontPrésents) {
          return false;
        }
      }

      if (code.startsWith('DEPT')) {
        const département = territoires.find(territoire => territoire.code === code);
        const laRégionParenteEstPrésente = codes.includes(département!.codeParent!);
        if (!laRégionParenteEstPrésente) {
          return false;
        }
      }
    }
    return true;
  });

  const validationTerritoiresProfilsDépartementaux = z.string().array().refine(codes => {
    for (const code of codes) {
      if (!code.startsWith('DEPT')) {
        return false;
      }
    }
    return true;
  });

  const validationChantiersParmiTousLesChantiers = z.string().array().refine(chantiersIds => {
    const tousLesChantiersIds = new Set(chantiers.map(chantier => chantier.id));
    return chantiersIds.every(chantierId => tousLesChantiersIds.has(chantierId));
  });

  const validationChantiersParmiTousLesChantiersTerritorialisés = z.string().array().refine(chantiersIds => {
    const tousLesChantiersTerritorialisésIds = new Set(chantiers.filter(chantier => chantier.estTerritorialisé).map(chantier => chantier.id));
    return chantiersIds.every(chantierId => tousLesChantiersTerritorialisésIds.has(chantierId));
  });

  return z.discriminatedUnion('profil', [
    z.object({
      profil: z.literal('DITP_ADMIN'),
    }).strict(),
    z.object({
      profil: z.literal('DITP_PILOTAGE'),
    }).strict(),
    z.object({
      profil: z.literal('PR'),
    }).strict(),
    z.object({
      profil: z.literal('PM_ET_CABINET'),
    }).strict(),
    z.object({
      profil: z.literal('CABINET_MTFP'),
    }).strict(),
    z.object({
      profil: z.literal('CABINET_MINISTERIEL'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('DIR_ADMIN_CENTRALE'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('SECRETARIAT_GENERAL'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('EQUIPE_DIR_PROJET'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('DIR_PROJET'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),    
    z.object({
      profil: z.literal('REFERENT_REGION'),
      habilitations: z.object({
        lecture: z.object({
          territoires: validationTerritoiresProfilsRégionaux,
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('PREFET_REGION'),
      habilitations: z.object({
        lecture: z.object({
          territoires: validationTerritoiresProfilsRégionaux,
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('SERVICES_DECONCENTRES_REGION'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsRégionaux,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('REFERENT_DEPARTEMENT'),
      habilitations: z.object({
        lecture: z.object({
          territoires: validationTerritoiresProfilsDépartementaux,
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('PREFET_DEPARTEMENT'),
      habilitations: z.object({
        lecture: z.object({
          territoires: validationTerritoiresProfilsDépartementaux,
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('SERVICES_DECONCENTRES_DEPARTEMENT'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsDépartementaux,
          périmètres: z.string().array(),
        }),
      }), 
    }).strict(),
    z.object({
      profil: z.literal('DROM'),
    }).strict(),
  ]);
} 
