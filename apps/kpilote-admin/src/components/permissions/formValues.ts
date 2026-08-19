import type {
  CollectionPermissionWriteActionValue,
  IndicateurPermissionWriteActionValue,
} from '@pilote/kpilote-shared/permission'

// Union des actions d'écriture, tous domaines confondus : PermissionSection ne
// connaît pas le domaine de la section qu'elle rend (cf. retour de review sur
// les types domain-agnostiques). La restriction par section est portée par les
// options passées à la section, et vérifiée à la sérialisation.
export type PermissionWriteActionValue =
  IndicateurPermissionWriteActionValue | CollectionPermissionWriteActionValue

export type PermissionRow = {
  publicId: string
  nom: string
  writeActions: PermissionWriteActionValue[]
}

export type PermissionsFormValues = {
  indicateurs: PermissionRow[]
  collections: PermissionRow[]
}

export type PermissionSectionName = 'indicateurs' | 'collections'
