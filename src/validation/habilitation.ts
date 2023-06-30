import { z } from 'zod';
import { deuxTableauxSontIdentiques } from '@/client/utils/arrays';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { codesTerritoiresDROM } from './utilisateur';

export default async function créerValidateurHabilitations(territoires: Territoire[], chantiers: ChantierSynthétisé[]) {
  const validationTousLesTerritoires = z.string().array().refine(codes => {
    const territoiresCodes = territoires.map(territoire => territoire.code);
    return deuxTableauxSontIdentiques(codes, territoiresCodes);
  });

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

  const validationTerritoiresProfilDrom =  z.string().array().refine(codes => deuxTableauxSontIdentiques(codes, codesTerritoiresDROM));

  const validationTousLesChantiers = z.string().array().refine(chantiersIds => {
    const tousLesChantiersIds = chantiers.map(chantier => chantier.id);
    return deuxTableauxSontIdentiques(chantiersIds, tousLesChantiersIds);
  });

  const validationChantiersTerritorialisés = z.string().array().refine(chantiersIds => {
    const tousLesChantiersTerritorialisésIds = chantiers.filter(chantier => chantier.estTerritorialisé).map(chantier => chantier.id);
    return deuxTableauxSontIdentiques(chantiersIds, tousLesChantiersTerritorialisésIds);
  });

  const validationChantiersParmiTousLesChantiers = z.string().array().refine(chantiersIds => {
    const tousLesChantiersIds = new Set(chantiers.map(chantier => chantier.id));
    return chantiersIds.every(chantierId => tousLesChantiersIds.has(chantierId));
  });

  const validationChantiersParmiTousLesChantiersTerritorialisés = z.string().array().refine(chantiersIds => {
    const tousLesChantiersTerritorialisésIds = new Set(chantiers.filter(chantier => chantier.estTerritorialisé).map(chantier => chantier.id));
    return chantiersIds.every(chantierId => tousLesChantiersTerritorialisésIds.has(chantierId));
  });

  const validationPérimètresProfilDrom = z.string().array().refine(périmètresIds => {
    return périmètresIds.length === 1 && périmètresIds[0] === 'PER-018';
  });

  return z.union([
    z.object({
      profil: z.literal('DITP_ADMIN'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('DITP_PILOTAGE'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('PR'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('PM_ET_CABINET'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('CABINET_MTFP'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('CABINET_MINISTERIEL'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('DIR_ADMIN_CENTRALE'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('SECRETARIAT_GENERAL'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('EQUIPE_DIR_PROJET'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('DIR_PROJET'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiers,
          territoires: validationTousLesTerritoires,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),    
    z.object({
      profil: z.literal('REFERENT_REGION'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsRégionaux,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('PREFET_REGION'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsRégionaux,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('SERVICES_DECONCENTRES_REGION'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsRégionaux,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('REFERENT_DEPARTEMENT'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsDépartementaux,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('PREFET_DEPARTEMENT'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsDépartementaux,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('SERVICES_DECONCENTRES_DEPARTEMENT'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersParmiTousLesChantiersTerritorialisés,
          territoires: validationTerritoiresProfilsDépartementaux,
          périmètres: z.string().array(),
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
    z.object({
      profil: z.literal('DROM'),
      habilitations: z.object({
        lecture: z.object({
          chantiers: validationChantiersTerritorialisés,
          territoires: validationTerritoiresProfilDrom,
          périmètres: validationPérimètresProfilDrom,
        }),
        'saisie.indicateur': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
        'saisie.commentaire': z.object({
          chantiers: z.string().array(),
          territoires: z.string().array(),
          périmètres: z.string().array(),
        }),
      }), 
    }),
  ]);
} 
