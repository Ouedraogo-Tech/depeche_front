import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Categorie, CategorieRequest } from '../models/categorie.model';

// Appels au backend pour les catégories (Politique, Économie, Sport...)
@Injectable({ providedIn: 'root' })
export class CategorieService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categories`; // → /api/categories

  // GET /api/categories : PUBLIC (formulaire d'article, footer, menu Actualités)
  lister(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(this.url);
  }

  // POST /api/categories : responsable éditorial
  creer(categorie: CategorieRequest): Observable<Categorie> {
    return this.http.post<Categorie>(this.url, categorie);
  }

  // PUT /api/categories/{id} : responsable éditorial
  modifier(id: number, categorie: CategorieRequest): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.url}/${id}`, categorie);
  }

  // DELETE /api/categories/{id} : responsable éditorial (refusé si des articles l'utilisent)
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
