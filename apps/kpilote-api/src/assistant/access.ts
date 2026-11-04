import { type Principal } from '@/framework/auth/userContext'

/**
 * Point de contrôle unique de l'accès à l'assistant. Les droits par profil et par e-mail
 * (lot 6) s'y brancheront ; d'ici là, l'assistant est réservé aux personnes connectées.
 */
export const checkAssistantAccess = (principal: Principal): boolean => principal.kind === 'user'
