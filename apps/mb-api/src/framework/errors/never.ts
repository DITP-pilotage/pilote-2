export const never = (): never => {
  throw new Error('unreachable')
}
