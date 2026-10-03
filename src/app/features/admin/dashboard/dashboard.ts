import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ArticleService } from '../../../core/api/article.service';
import { RoleService } from '../../../core/api/role.service';
import { StatistiqueService } from '../../../core/api/statistique.service';
import { UtilisateurService } from '../../../core/api/utilisateur.service';
import { ApiError } from '../../../core/models/api-error.model';
import { Statistiques } from '../../../core/models/statistiques.model';
import { RoleName, Utilisateur } from '../../../core/models/utilisateur.model';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';

// Texte affiché pour chaque rôle dans le tableau du personnel
const LIBELLES_ROLES: Record<RoleName, string> = {
  ADMIN: 'Admin',
  JOURNALISTE: 'Journaliste',
  RESPONSABLE_EDITORIAL: 'Resp. éditorial',
  WEBMASTER: 'Webmaster',
  LECTEUR: 'Lecteur',
};

// Page d'accueil de l'espace administrateur : toutes les données viennent du backend
@Component({
  selector: 'app-dashboard-admin',
  imports: [StatCard, StatusBadge, Panel, RouterLink, ConfirmDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardAdmin {
  private readonly statistiqueService = inject(StatistiqueService);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly roleService = inject(RoleService);
  private readonly articleService = inject(ArticleService);

  protected readonly libellesRoles = LIBELLES_ROLES;

  // Données qui CHANGENT après une action → signal rempli par nos méthodes charger...()
  protected readonly statistiques = signal<Statistiques | undefined>(undefined);
  protected readonly utilisateurs = signal<Utilisateur[]>([]);

  // Données en lecture seule → toSignal suffit
  protected readonly roles = toSignal(this.roleService.lister(), { initialValue: [] });
    // Articles rechargés toutes les 30 s : le bloc "Consulter les articles" reste à jour
  private readonly articles = toSignal(
    timer(0, 30000).pipe(switchMap(() => this.articleService.lister().pipe(catchError(() => EMPTY)))),
    { initialValue: [] },
  );
  protected readonly articlesRecents = computed(() => this.articles().slice(0, 3));

  // Le compte en attente de confirmation (null = pas de fenêtre ouverte)
  protected readonly aConfirmer = signal<Utilisateur | null>(null);
  protected readonly erreurAction = signal<string | null>(null);

  constructor() {
        // Statistiques rechargées toutes les 30 s (arrêt automatique quand on quitte la page)
    timer(0, 30000).pipe(takeUntilDestroyed()).subscribe(() => this.chargerStatistiques());
    this.chargerUtilisateurs();
  }

  private chargerStatistiques(): void {
    this.statistiqueService.obtenir().subscribe((stats) => this.statistiques.set(stats));
  }

  private chargerUtilisateurs(): void {
    this.utilisateurService.lister().subscribe((liste) => this.utilisateurs.set(liste));
  }

  // Clic sur "Désactiver" ou "Réactiver" dans la fenêtre de confirmation
  protected confirmerChangementStatut(): void {
    const compte = this.aConfirmer();
    if (!compte) {
      return;
    }
    this.erreurAction.set(null);

    const action = compte.actif
      ? this.utilisateurService.suspendre(compte.id) // PATCH /api/utilisateurs/{id}/suspendre
      : this.utilisateurService.activer(compte.id); // PATCH /api/utilisateurs/{id}/activer

    action.subscribe({
      next: (compteMisAJour) => {
        // On remplace l'ancienne ligne du tableau par la nouvelle version renvoyée par le backend
        this.utilisateurs.update((liste) =>
          liste.map((u) => (u.id === compteMisAJour.id ? compteMisAJour : u)),
        );
        this.chargerStatistiques(); // les cartes "actifs / désactivés" changent aussi
        this.aConfirmer.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.erreurAction.set((e.error as ApiError | null)?.message ?? 'Action impossible.');
        this.aConfirmer.set(null);
      },
    });
  }
}
