import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UtilisateurService } from '../../../core/api/utilisateur.service';
import { ApiError } from '../../../core/models/api-error.model';
import { LIBELLES_ROLES, RoleName, Utilisateur } from '../../../core/models/utilisateur.model';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatCard } from '../../../shared/ui/stat-card/stat-card';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

// Page "Personnel" : tous les comptes, recherche, filtres, actions
@Component({
  selector: 'app-admin-personnel',
  imports: [DatePipe, RouterLink, Panel, StatCard, StatusBadge, ConfirmDialog],
  templateUrl: './personnel.html',
  styleUrl: './personnel.css',
})
export class AdminPersonnel {
  private readonly utilisateurService = inject(UtilisateurService);

  protected readonly libellesRoles = LIBELLES_ROLES;
  protected readonly roles = Object.keys(LIBELLES_ROLES) as RoleName[];

  // undefined = chargement en cours
  protected readonly utilisateurs = signal<Utilisateur[] | undefined>(undefined);

  // Filtres
  protected readonly recherche = signal('');
  protected readonly roleFiltre = signal<RoleName | 'TOUS'>('TOUS');
  protected readonly statutFiltre = signal<'TOUS' | 'ACTIF' | 'DESACTIVE'>('TOUS');

  // Désactiver / Réactiver
  protected readonly aConfirmer = signal<Utilisateur | null>(null);
  protected readonly erreurAction = signal<string | null>(null);

  private readonly liste = computed(() => this.utilisateurs() ?? []);
  protected readonly nbActifs = computed(() => this.liste().filter((u) => u.actif).length);
  protected readonly nbDesactives = computed(() => this.liste().filter((u) => !u.actif).length);

  protected readonly utilisateursFiltres = computed(() => {
    const motCle = this.recherche().trim().toLowerCase();
    return this.liste().filter(
      (u) =>
        (this.roleFiltre() === 'TOUS' || u.roles.includes(this.roleFiltre() as RoleName)) &&
        (this.statutFiltre() === 'TOUS' || (this.statutFiltre() === 'ACTIF') === u.actif) &&
        (motCle === '' || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(motCle)),
    );
  });

  constructor() {
    this.utilisateurService.lister().subscribe({
      next: (liste) => this.utilisateurs.set(liste),
      error: () => this.utilisateurs.set([]),
    });
  }

  protected confirmerChangementStatut(): void {
    const compte = this.aConfirmer();
    if (!compte) {
      return;
    }
    this.erreurAction.set(null);
    const action = compte.actif
      ? this.utilisateurService.suspendre(compte.id)
      : this.utilisateurService.activer(compte.id);

    action.subscribe({
      next: (maj) => {
        this.utilisateurs.update((liste) => liste?.map((u) => (u.id === maj.id ? maj : u)));
        this.aConfirmer.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.erreurAction.set((e.error as ApiError | null)?.message ?? 'Action impossible.');
        this.aConfirmer.set(null);
      },
    });
  }
}
