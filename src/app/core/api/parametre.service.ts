import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ParametreSite } from '../models/parametre-site.model';

// Paramètres du site (pied de page)
@Injectable({ providedIn: 'root' })
export class ParametreService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/parametres`; // → /api/parametres

  // GET /api/parametres : public
  obtenir(): Observable<ParametreSite> {
    return this.http.get<ParametreSite>(this.url);
  }

  // PUT /api/parametres : webmaster uniquement
  modifier(parametres: ParametreSite): Observable<ParametreSite> {
    return this.http.put<ParametreSite>(this.url, parametres);
  }
}
