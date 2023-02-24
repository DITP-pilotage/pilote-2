export const maillesInternes = ['régionale', 'départementale'] as const;
export const mailles = ['nationale', ...maillesInternes] as const;

export type Maille = typeof mailles[number];
export type MailleInterne = typeof maillesInternes[number];
