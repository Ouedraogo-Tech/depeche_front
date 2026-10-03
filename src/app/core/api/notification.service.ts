import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NotificationUtilisateur } from '../models/notification.model';

// Notifications de l'utilisateur connecté
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/notifications`; // → /api/notifications

  // Nombre de notifications non lues : partagé entre la barre latérale (badge) et les pages
  private readonly _nonLues = signal(0);
  readonly nonLues = this._nonLues.asReadonly();

  // GET /api/notifications : mes notifications, les plus récentes d'abord
  lister(): Observable<NotificationUtilisateur[]> {
    return this.http.get<NotificationUtilisateur[]>(this.url);
  }

  // GET /api/notifications/non-lues : { "nombre": 2 } → met à jour le badge
  rafraichirNonLues(): void {
    this.http.get<{ nombre: number }>(`${this.url}/non-lues`).subscribe({
      next: (reponse) => this._nonLues.set(reponse.nombre),
      error: () => this._nonLues.set(0),
    });
  }

  // PATCH /api/notifications/{id}/lue (appelée seulement sur une notification non lue : le badge baisse de 1)
  marquerLue(id: number): Observable<NotificationUtilisateur> {
    return this.http
      .patch<NotificationUtilisateur>(`${this.url}/${id}/lue`, {})
      .pipe(tap(() => this._nonLues.update((n) => Math.max(0, n - 1))));
  }

  // PATCH /api/notifications/lire-tout : le badge passe à 0
  toutMarquerLu(): Observable<void> {
    return this.http.patch<void>(`${this.url}/lire-tout`, {}).pipe(tap(() => this._nonLues.set(0)));
  }
}
