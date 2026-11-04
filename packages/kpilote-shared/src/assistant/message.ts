import type { UIDataTypes, UIMessage } from 'ai'

import type { KpiloteUITools } from './tools'

export type KpiloteMessageMetadata = { llmCallId?: string }

export type KpiloteUIMessage = UIMessage<KpiloteMessageMetadata, UIDataTypes, KpiloteUITools>
