import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Role } from '../models/role.model';

// Rôles et leurs permissions (espace Administrateur)
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/roles`; // → /api/roles

  lister(): Observable<Role[]> {
    return this.http.get<Role[]>(this.url);
  }
}
