import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AbonneNewsletter, EnvoiNewsletter, ResultatEnvoi } from '../models/abonne-newsletter.model';

// Appels au backend pour la newsletter
@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/newsletter`; // → /api/newsletter

  // GET /api/newsletter : webmaster (tous les abonnés, actifs et désabonnés)
  lister(): Observable<AbonneNewsletter[]> {
    return this.http.get<AbonneNewsletter[]>(this.url);
  }

  // POST /api/newsletter/abonner : PUBLIC (formulaire du site) · réactive un ancien abonné
  abonner(email: string): Observable<AbonneNewsletter> {
    return this.http.post<AbonneNewsletter>(`${this.url}/abonner`, { email });
  }

  // POST /api/newsletter/envoyer : webmaster (les articles choisis, aux abonnés choisis, un e-mail par abonné)
  envoyer(demande: EnvoiNewsletter): Observable<ResultatEnvoi> {
    return this.http.post<ResultatEnvoi>(`${this.url}/envoyer`, demande);
  }

  // PATCH /api/newsletter/{id}/desabonner : webmaster (l'abonné est désactivé, pas effacé)
  desabonner(id: number): Observable<AbonneNewsletter> {
    return this.http.patch<AbonneNewsletter>(`${this.url}/${id}/desabonner`, {});
  }

  // POST /api/newsletter/desabonner?jeton=... : PUBLIC (lien "Se désabonner" reçu par e-mail)
  desabonnerParJeton(jeton: string): Observable<void> {
    return this.http.post<void>(`${this.url}/desabonner`, null, { params: new HttpParams().set('jeton', jeton) });
  }
}