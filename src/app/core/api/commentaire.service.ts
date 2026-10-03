import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Commentaire, CommentaireRequest, StatutCommentaire } from '../models/commentaire.model';

// Appels au backend pour les commentaires
@Injectable({ providedIn: 'root' })
export class CommentaireService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/commentaires`; // → /api/commentaires

  // GET /api/commentaires/article/{id} : PUBLIC, uniquement les commentaires publiés
  listerParArticle(articleId: number): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.url}/article/${articleId}`);
  }

  // POST /api/commentaires?articleId=1 : lecteur connecté
  ecrire(articleId: number, commentaire: CommentaireRequest): Observable<Commentaire> {
    return this.http.post<Commentaire>(this.url, commentaire, { params: { articleId } });
  }

  // GET /api/commentaires/mes-articles : journaliste
  surMesArticles(): Observable<Commentaire[]> {
    return this.http.get<Commentaire[]>(`${this.url}/mes-articles`);
  }

  // GET /api/commentaires (?statut=MASQUE) : webmaster
  lister(statut?: StatutCommentaire): Observable<Commentaire[]> {
    let params = new HttpParams();
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<Commentaire[]>(this.url, { params });
  }

  // PATCH /api/commentaires/{id}/masquer et /publier, DELETE /api/commentaires/{id} : webmaster
  masquer(id: number): Observable<Commentaire> {
    return this.http.patch<Commentaire>(`${this.url}/${id}/masquer`, {});
  }

  publier(id: number): Observable<Commentaire> {
    return this.http.patch<Commentaire>(`${this.url}/${id}/publier`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
