import { Injectable } from '@angular/core';

// Nom sous lequel le token est rangé dans le navigateur
const CLE_TOKEN = 'depeche226_token';

// Range, relit et supprime le token JWT dans le navigateur (localStorage)
@Injectable({ providedIn: 'root' })
export class TokenService {
  // Après la connexion : on range le token
  enregistrer(token: string): void {
    localStorage.setItem(CLE_TOKEN, token);
  }

  // À chaque appel au backend : on relit le token (null si personne n'est connecté)
  lire(): string | null {
    return localStorage.getItem(CLE_TOKEN);
  }

  // À la déconnexion (ou si le token a expiré) : on le supprime
  supprimer(): void {
    localStorage.removeItem(CLE_TOKEN);
  }
}
