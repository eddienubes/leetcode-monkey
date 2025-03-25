import type { MessageEntity } from '@grammyjs/parse-mode/dist/deps.node'
import { BullQueue } from '@/common'
import { ReplyMarkup } from '@/tg/types'

export class EditMessageQueue extends BullQueue {
  static queueName = 'edit-message-queue'

  tgChatUuid: string
  tgMessageId: string
  contents: {
    message: string
    entities?: MessageEntity[]
    replyMarkup?: ReplyMarkup
  }
}

export class DeleteMessageQueue extends BullQueue {
  static queueName = 'delete-message-queue'

  tgChatUuid: string
  tgMessageId: number
}