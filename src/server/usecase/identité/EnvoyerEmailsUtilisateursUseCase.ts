import nodemailer from 'nodemailer';
import assert from 'node:assert/strict';
import UtilisateurPourImport from '@/server/domain/identité/UtilisateurPourImport';
import configuration from '@/server/infrastructure/Configuration';
import logger from '@/server/infrastructure/logger';

/**
 * TODO:
 * - Remplacé par Keycloak ? Supprimer ? Sinon 👇
 * - Pourquoi ça quitte pas ?
 * - Combien d'adresses email on peut mettre dans le champs `to` ?
 * - Comprendre les params ici : https://nodemailer.com/smtp/
 * - Extraire un service ?
 * - Pour tester j'ai utilisé ça : https://github.com/gessnerfl/fake-smtp-server
 */

export default class EnvoyerEmailsUtilisateursUseCase {

  async run(utilisateursPourImport: UtilisateurPourImport[]) {
    assert(utilisateursPourImport);
    assert.notDeepEqual([], utilisateursPourImport);

    const smtpPort = configuration.smtpPort;
    const smtpHost = configuration.smtpHost;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: configuration.smtpUsername,
        pass: configuration.smtpPassword,
      },
    });

    const emails = utilisateursPourImport.map(it => it.email);
    const info = await transporter.sendMail({
      from: configuration.fromAddress,
      to: emails.join(', '),
      subject: 'Hello ✔',
      text: 'Hello world?',
      html: '<b>Hello world?</b>',
    });

    logger.debug('Message sent: %s', info.messageId);
  }
}
