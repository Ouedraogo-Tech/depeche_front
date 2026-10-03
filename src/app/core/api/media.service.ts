import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// Envoi des images des articles (POST /api/medias)
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medias`; // → /api/medias

  // Envoie le fichier ; le backend répond { url: "/uploads/xxxx.jpg" }
  televerser(fichier: File): Observable<{ url: string }> {
    const donnees = new FormData();
    donnees.append('fichier', fichier); // "fichier" = le nom attendu par MediaController.java
    return this.http.post<{ url: string }>(this.url, donnees);
  }
}
