// lib/api-client.ts
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private async getAuthHeaders() {
    const session = await getSession();
    
    if (!session?.accessToken) {
      throw new Error('Non authentifié');
    }
    
    return {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async generatePresentation(params: { territoire_code: string, maille: string }): Promise<{ task_id: string, status: string }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expiré - veuillez vous reconnecter');
      }
      if (response.status === 403) {
        throw new Error('Permissions insuffisantes');
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json() as Promise<{ task_id: string, status: string }>;
  }

  async checkStatus(taskId: string): Promise<{ status: string }> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/status/${taskId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la vérification du statut: ${response.status}`);
    }

    return response.json();
  }

  async downloadPresentation(taskId: string) {
    const headers = await this.getAuthHeaders();
    delete headers['Content-Type']; // Pour le téléchargement de fichier

    const response = await fetch(`${API_BASE_URL}/download/${taskId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement: ${response.status}`);
    }

    return response.blob();
  }

  async getUserInfo() {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers,
    });

    return response.json();
  }

  async getMyTasks() {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/my-tasks`, {
      headers,
    });

    return response.json();
  }
}

export const apiClient = new ApiClient();
