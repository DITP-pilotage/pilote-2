type ChantierPermissions = { [key: ChantierId]: string[] };

type ChantierId = string;

type Permissions = {
  chantiers: ChantierPermissions
};

export function permissionsChantierIds(permissions: Permissions) {
  return Object.keys(permissions.chantiers);
}

export function permissionsPourChantierIds(...chantierIds: string[]) {
  const chantierPermissions: ChantierPermissions = {};
  for (const chantierId of chantierIds) {
    chantierPermissions[chantierId] = ['read'];
  }
  return { chantiers: chantierPermissions };
}

export default Permissions;
