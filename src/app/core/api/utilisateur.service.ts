import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  RoleName,
  Utilisateur,
  UtilisateurModification,
  UtilisateurRequest,
} from '../models/utilisateur.model';

// Appels au backend pour les comptes utilisateurs (espace Administrateur + Profil)
@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/utilisateurs`; // → /api/utilisateurs

  // GET /api/utilisateurs : tous les comptes (admin)
  lister(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.url);
  }

  // POST /api/utilisateurs : créer un compte (admin)
  creer(utilisateur: UtilisateurRequest): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.url, utilisateur);
  }

  // PUT /api/utilisateurs/{id} : modifier un compte (admin)
  modifier(id: number, modification: UtilisateurModification): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.url}/${id}`, modification);
  }

  // PATCH /api/utilisateurs/{id}/suspendre et /activer
  suspendre(id: number): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.url}/${id}/suspendre`, {});
  }

  activer(id: number): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.url}/${id}/activer`, {});
  }

  // PATCH /api/utilisateurs/{id}/role?role=JOURNALISTE
  attribuerRole(id: number, role: RoleName): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.url}/${id}/role`, {}, { params: { role } });
  }

  // GET /api/utilisateurs/moi : le profil de l'utilisateur connecté
  monProfil(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.url}/moi`);
  }
    // PUT /api/utilisateurs/moi : l'utilisateur connecté modifie son propre profil
  modifierMonProfil(modification: UtilisateurModification): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.url}/moi`, modification);
  }
}
