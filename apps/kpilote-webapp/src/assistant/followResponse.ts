// Au-delà, on considère que l'utilisateur a remonté le fil pour relire : on ne le ramène
// plus en bas à chaque morceau de réponse.
export const FOLLOW_THRESHOLD_PX = 50

export const isNearBottom = ({
  scrollTop,
  scrollHeight,
  clientHeight,
}: {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}): boolean => scrollHeight - scrollTop - clientHeight < FOLLOW_THRESHOLD_PX
