import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { ArticleService } from '../../../core/api/article.service';
import { UtilisateurService } from '../../../core/api/utilisateur.service';
import { LIBELLES_ROLES, Utilisateur } from '../../../core/models/utilisateur.model';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';

// Fiche d'un membre du personnel (consultation) : /admin/personnel/5
// Les actions (rôle, désactivation) sont sur la page "Modifier"
@Component({
  selector: 'app-fiche-utilisateur',
  imports: [DatePipe, RouterLink, Panel, StatusBadge, Avatar, Spinner],
  templateUrl: './fiche-utilisateur.html',
  styleUrl: './fiche-utilisateur.css',
})
export class FicheUtilisateur {
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly articleService = inject(ArticleService);

  id = input.required<string>(); // le "5" de /admin/personnel/5

  protected readonly libellesRoles = LIBELLES_ROLES;

  // undefined = chargement · null = compte introuvable
  protected readonly utilisateur = signal<Utilisateur | null | undefined>(undefined);

  // Ses articles (s'il en a écrit) : on filtre la liste de tous les articles
  private readonly articles = toSignal(this.articleService.lister().pipe(catchError(() => of([]))), {
    initialValue: [],
  });
  protected readonly sesArticles = computed(() => {
    const u = this.utilisateur();
    return u ? this.articles().filter((a) => a.auteurId === u.id) : [];
  });
  protected readonly nbPublies = computed(() => this.sesArticles().filter((a) => a.statut === 'PUBLIE').length);

  constructor() {
    // Le backend n'a pas de GET /api/utilisateurs/{id} : on charge la liste et on cherche le bon compte
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.utilisateurService.lister().pipe(
            map((liste) => liste.find((u) => u.id === Number(id)) ?? null),
            catchError(() => of(null)),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((u) => this.utilisateur.set(u));
  }
}
