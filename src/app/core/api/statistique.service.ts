import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Statistiques } from '../models/statistiques.model';

// Chiffres des dashboards (Admin, Responsable éditorial, Webmaster)
@Injectable({ providedIn: 'root' })
export class StatistiqueService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/statistiques`; // → /api/statistiques

  obtenir(): Observable<Statistiques> {
    return this.http.get<Statistiques>(this.url);
  }
}
