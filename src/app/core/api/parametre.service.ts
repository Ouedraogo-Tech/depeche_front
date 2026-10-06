import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ParametreSite } from '../models/parametre-site.model';

// Les logos d'origine (dossier public/images/logo), utilisés tant que le webmaster n'en a pas envoyé
const LOGOS_ORIGINE = {
  normal: 'images/logo/logo.png',
  blanc: 'images/logo/logo-blanc.png',
  complet: 'images/logo/logo-complet.png',
};

// Les adresses des logos à afficher
export interface LogosSite {
  normal: string; // fond clair : en-tête du site public
  blanc: string; // fond sombre : barre des espaces de travail
  blancSurPastille: boolean; // true = pas de version "fond sombre" : le logo normal est posé sur une pastille blanche
  complet: string; // avec le slogan : pages de connexion
}

// Paramètres du site (pied de page, pages légales, logos)
@Injectable({ providedIn: 'root' })
export class ParametreService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/parametres`; // → /api/parametres

  // Paramètres chargés UNE fois pour tout le site (undefined = chargement · null = erreur)
  private readonly enregistres = signal<ParametreSite | null | undefined>(undefined);

  // Les logos à afficher : ceux du webmaster, sinon ceux d'origine.
  // null pendant le chargement : on n'affiche pas l'ancien logo une fraction de seconde.
  readonly logos = computed<LogosSite | null>(() => {
    const p = this.enregistres();
    if (p === undefined) {
      return null;
    }
    // Un seul logo envoyé ? On le réutilise partout, pour garder la même identité visuelle
    return {
      normal: p?.logo || LOGOS_ORIGINE.normal,
      blanc: p?.logoBlanc || p?.logo || LOGOS_ORIGINE.blanc,
      blancSurPastille: !p?.logoBlanc && !!p?.logo,
      complet: p?.logoComplet || p?.logo || LOGOS_ORIGINE.complet,
    };
  });

  constructor() {
    this.obtenir().subscribe({
      next: (p) => this.enregistres.set(p),
      error: () => this.enregistres.set(null),
    });
  }

  // GET /api/parametres : public
  obtenir(): Observable<ParametreSite> {
    return this.http.get<ParametreSite>(this.url);
  }

  // PUT /api/parametres : webmaster uniquement (les logos du site changent tout de suite)
  modifier(parametres: ParametreSite): Observable<ParametreSite> {
    return this.http.put<ParametreSite>(this.url, parametres).pipe(tap((p) => this.enregistres.set(p)));
  }
}
