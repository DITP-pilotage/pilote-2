import { type Principal } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'

/**
 * Point de contrôle unique de l'accès à l'assistant : réservé aux personnes connectées que
 * l'administration a autorisées, tant qu'il n'est pas coupé. Les clés API, admins compris,
 * n'y ont jamais accès.
 */
export const checkAssistantAccess = async (principal: Principal): Promise<boolean> => {
  if (principal.kind !== 'user') return false
  const [parametres, acces] = await Promise.all([
    db().assistantParametres.findUnique({ where: { id: 1 }, select: { actif: true } }),
    db().assistantAccesUtilisateur.findUnique({
      where: { utilisateurId: principal.user.id },
      select: { utilisateurId: true },
    }),
  ])
  return parametres?.actif === true && acces !== null
}
