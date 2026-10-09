import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Article, ArticleRequest, DecisionEditoriale, StatutArticle } from '../models/article.model';

// Appels au backend pour les articles : tout leur cycle de vie
@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/articles`; // → /api/articles

  // ===== Lecture (back-office) =====

  // GET /api/articles (?statut=SOUMIS) : tous les articles (RE, admin, webmaster)
  lister(statut?: StatutArticle): Observable<Article[]> {
    let params = new HttpParams();
    if (statut) {
      params = params.set('statut', statut);
    }
    return this.http.get<Article[]>(this.url, { params });
  }

  // GET /api/articles/moi : les articles du journaliste connecté
  mesArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.url}/moi`);
  }

  // GET /api/articles/{id} : un article, quel que soit son statut
  obtenir(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.url}/${id}`);
  }

  // ===== Lecture (site public, sans connexion) =====

  // GET /api/articles/publies (?categorieId=2&recherche=coton)
  listerPublies(categorieId?: number, recherche?: string): Observable<Article[]> {
    let params = new HttpParams();
    if (categorieId) {
      params = params.set('categorieId', categorieId);
    }
    if (recherche) {
      params = params.set('recherche', recherche);
    }
    return this.http.get<Article[]>(`${this.url}/publies`, { params });
  }

  // GET /api/articles/publies/{id}
  // lien = adresse lisible (slug) de l'article, ou ancien numéro
  obtenirPublie(lien: string | number): Observable<Article> {
    return this.http.get<Article>(`${this.url}/publies/${encodeURIComponent(lien)}`);
  }

  // ===== Rédaction (journaliste, responsable éditorial) =====

  // POST /api/articles : crée un BROUILLON
  creer(article: ArticleRequest): Observable<Article> {
    return this.http.post<Article>(this.url, article);
  }

  // PUT /api/articles/{id}
  modifier(id: number, article: ArticleRequest): Observable<Article> {
    return this.http.put<Article>(`${this.url}/${id}`, article);
  }

  // DELETE /api/articles/{id}
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  // ===== Changements de statut =====

  // PATCH /api/articles/{id}/soumettre[?date=2026-10-06T16:00:00] : BROUILLON, À RÉVISER ou REFUSÉ → SOUMIS.
  // date = publication souhaitée (facultative), appliquée seulement si l'article est validé
  soumettre(id: number, dateSouhaitee: string | null = null): Observable<Article> {
    const params = dateSouhaitee ? new HttpParams().set('date', dateSouhaitee) : undefined;
    return this.http.patch<Article>(`${this.url}/${id}/soumettre`, {}, { params });
  }

  // PATCH /api/articles/{id}/publier : publication directe (RE sur ce qu'il a écrit)
  publier(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/publier`, {});
  }

  // PATCH /api/articles/{id}/brouillon et /archiver
  remettreEnBrouillon(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/brouillon`, {});
  }

  archiver(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/archiver`, {});
  }

  // PATCH /api/articles/{id}/planifier?date=2026-10-05T08:00:00 : publication automatique à cette date
  planifier(id: number, date: string): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/planifier`, {}, { params: new HttpParams().set('date', date) });
  }

  // ===== Décisions du responsable éditorial (article SOUMIS uniquement) =====

  // SOUMIS → PUBLIÉ (commentaire facultatif)
  valider(id: number, decision: DecisionEditoriale = {}): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/valider`, decision);
  }

  // SOUMIS → À RÉVISER (commentaire obligatoire)
  demanderModification(id: number, decision: DecisionEditoriale): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/demander-modification`, decision);
  }

  // SOUMIS → REFUSÉ (commentaire obligatoire)
  refuser(id: number, decision: DecisionEditoriale): Observable<Article> {
    return this.http.patch<Article>(`${this.url}/${id}/refuser`, decision);
  }
}
