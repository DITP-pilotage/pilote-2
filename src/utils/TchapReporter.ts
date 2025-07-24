import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { envoieMessageTchap } from '@/server/utils/notification-tchap';

class TchapReporter implements Reporter {
  private tchapBaseUrl: string;

  private accessToken: string;

  private roomId: string;

  private failures: Array<{ test: TestCase; result: TestResult }> = [];

  constructor(options: { 
    baseUrl?: string; 
    accessToken?: string; 
    roomId?: string; 
  } = {}) {
    this.tchapBaseUrl = options.baseUrl || process.env.TCHAP_BASE_URL || '';
    this.accessToken = options.accessToken || process.env.TCHAP_ACCESS_TOKEN || '';
    this.roomId = options.roomId || process.env.TCHAP_ROOM_ID_E2E || '';
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      this.failures.push({ test, result });
    }
  }

  async onEnd(result: FullResult) {
    if (!this.accessToken || !this.roomId) {
      // eslint-disable-next-line no-console
      console.log('Configuration Tchap manquante (ACCESS_TOKEN ou ROOM_ID)');
      return;
    }

    // Envoyer seulement en cas d'échec
    if (result.status === 'failed' || this.failures.length > 0) {
      const message = this.buildTchapMessage(result);
      
      // Utiliser la fonction existante
      envoieMessageTchap(
        message,
        this.tchapBaseUrl,
        this.roomId,
        this.accessToken,
      );
    }
  }

  private buildTchapMessage(result: FullResult): string {
    const status = result.status === 'passed' ? '✅' : '❌';
    const failureCount = this.failures.length;
    const timestamp = new Date().toLocaleString('fr-FR', { 
      timeZone: 'Europe/Paris',
      dateStyle: 'short',
      timeStyle: 'short',
    });
    
    let message = `${status} **Tests E2E Pilote - ${result.status.toUpperCase()}**\n\n`;
    message += `📊 **Résumé** (${timestamp}):\n`;
    message += `• Statut: \`${result.status}\`\n`;
    message += `• Nombre d'échecs: \`${failureCount}\`\n`;
    
    if (this.failures.length > 0) {
      message += '\n🚨 **Échecs détectés:**\n';
      
      this.failures
        .slice(0, 5) // Limite à 5 échecs pour éviter les messages trop longs
        .forEach(({ test, result: resultFailures }, index) => {
          const error = resultFailures.error?.message?.split('\n')[0] || 'Erreur inconnue';
          message += `${index + 1}. **${test.title}**\n   \`${error}\`\n\n`;
        });

      if (this.failures.length > 5) {
        message += `... et **${this.failures.length - 5}** autres échecs\n`;
      }
      
      // Ajouter des liens utiles si besoin
      message += '\n📋 Consultez les logs détaillés pour plus d\'informations.';
    } else {
      message += '\n✨ Tous les tests sont passés avec succès !';
    }

    return message;
  }
}

export default TchapReporter;
