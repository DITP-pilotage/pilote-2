import { marked } from 'marked';
import logger from '@/server/infrastructure/Logger';

export function envoieMessageTchap(messageErreur: string): void {
  const messageId = Date.now() * 1_000_000;
  const baseUrl = process.env.TCHAP_BASE_URL;
  const roomId = process.env.TCHAP_ROOM_ID;
  const accessToken = process.env.TCHAP_ACCESS_TOKEN;

  const url = `${baseUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message/${messageId}?access_token=${accessToken}`;

  const data = {
    body: messageErreur,
    msgtype: 'm.text',
    format: 'org.matrix.custom.html',
    formatted_body: marked(messageErreur),
  };

  fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(responseData => logger.info('Message tchap envoyé', responseData))
    .catch(error => logger.info('Erreur envoie message tchap:', error));
}
