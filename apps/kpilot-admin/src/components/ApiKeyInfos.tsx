import type { ApiKeyApiModel } from '@pilote/kpilot-shared/apiKey'
import { formatDate } from '@pilote/kpilot-shared/formatDate'

const STATUS_LABEL: Record<ApiKeyApiModel['status'], string> = {
  active: 'Active',
  expired: 'Expirée',
  revoked: 'Révoquée',
}

export function ApiKeyInfos({ apiKey }: { apiKey: ApiKeyApiModel }) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-6 text-sm">
      <div>
        <span className="block text-text-muted">Rôle</span>
        <span className="text-text">{apiKey.role}</span>
      </div>
      <div>
        <span className="block text-text-muted">Statut</span>
        <span className="text-text">{STATUS_LABEL[apiKey.status]}</span>
      </div>
      <div>
        <span className="block text-text-muted">Créée le</span>
        <span className="text-text">{formatDate(apiKey.createdAt)}</span>
      </div>
      <div>
        <span className="block text-text-muted">Expire le</span>
        <span className="text-text">{formatDate(apiKey.expiresAt)}</span>
      </div>
    </div>
  )
}
