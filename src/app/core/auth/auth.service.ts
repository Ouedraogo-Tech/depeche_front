import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { InscriptionRequest, JwtPayload, LoginRequest, LoginResponse } from '../models/auth.model';
import { RoleName } from '../models/utilisateur.model';
import { lireToken, tokenExpire } from './jwt.utils';
import { TokenService } from './token.service';

// Connexion, inscription, déconnexion, et "qui est connecté ?"
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  // L'utilisateur connecté (contenu du token), ou null si personne.
  // Au démarrage de l'application (ou après F5), on relit le token déjà rangé.
  private readonly _utilisateur = signal<JwtPayload | null>(this.lireTokenValide());

  // Version en lecture seule, utilisée par les composants (ex : "Bienvenue, Ibrahim")
  readonly utilisateur = this._utilisateur.asReadonly();
  readonly estConnecte = computed(() => this._utilisateur() !== null);

  // Photo de profil de la personne connectée (chargée par la barre latérale, changée par la page Profil)
  private readonly _photo = signal<string | null>(null);
  readonly photo = this._photo.asReadonly();

  definirPhoto(url: string | null): void {
    this._photo.set(url);
  }

  // POST /api/auth/login → on range le token et on retient l'utilisateur
  connecter(identifiants: LoginRequest): Observable<JwtPayload> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, identifiants).pipe(
      map((reponse) => {
        const payload = lireToken(reponse.token);
        if (!payload) {
          throw new Error('Token illisible');
        }
        this.tokenService.enregistrer(reponse.token);
        this._utilisateur.set(payload);
        return payload;
      }),
    );
  }

  // POST /api/auth/inscription (compte LECTEUR), PUIS connexion automatique avec les mêmes identifiants
  inscrire(donnees: InscriptionRequest): Observable<JwtPayload> {
    return this.http
      .post(`${environment.apiUrl}/auth/inscription`, donnees)
      .pipe(switchMap(() => this.connecter({ email: donnees.email, motDePasse: donnees.motDePasse })));
  }

  // Déconnexion : on jette le token. L'équipe retourne à /connexion, un lecteur reste sur le site ('/')
  deconnecter(destination = '/connexion'): void {
    this.tokenService.supprimer();
    this._utilisateur.set(null);
    this._photo.set(null);
    this.router.navigateByUrl(destination);
  }

  // L'utilisateur connecté a-t-il ce rôle ?
  aLeRole(role: RoleName): boolean {
    return this._utilisateur()?.roles.includes(role) ?? false;
  }

  // Où envoyer l'utilisateur après sa connexion, selon son rôle
  cheminAccueil(): string {
    if (this.aLeRole('ADMIN')) return '/admin';
    if (this.aLeRole('RESPONSABLE_EDITORIAL')) return '/editorial';
    if (this.aLeRole('JOURNALISTE')) return '/journaliste';
    if (this.aLeRole('WEBMASTER')) return '/webmaster';
    return '/';
  }

  // Relit le token rangé : null s'il n'existe pas, s'il est abîmé ou s'il a expiré
  private lireTokenValide(): JwtPayload | null {
    const token = this.tokenService.lire();
    if (!token) {
      return null;
    }
    const payload = lireToken(token);
    if (!payload || tokenExpire(payload)) {
      this.tokenService.supprimer(); // token inutilisable : on le jette
      return null;
    }
    return payload;
  }
}
