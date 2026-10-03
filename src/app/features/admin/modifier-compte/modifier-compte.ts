import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { UtilisateurService } from '../../../core/api/utilisateur.service';
import { ApiError } from '../../../core/models/api-error.model';
import { LIBELLES_ROLES, RoleName, Utilisateur } from '../../../core/models/utilisateur.model';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Panel } from '../../../shared/ui/panel/panel';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { Spinner } from '../../../shared/ui/spinner/spinner';
import { ToastService } from '../../../shared/ui/toast/toast.service';

// Modifier un compte : /admin/personnel/5/modifier
// Formulaire (PUT /api/utilisateurs/{id}) + carte Actions (rôle, désactivation)
@Component({
  selector: 'app-modifier-compte',
  imports: [ReactiveFormsModule, RouterLink, Panel, StatusBadge, ConfirmDialog, Spinner],
  templateUrl: './modifier-compte.html',
  styleUrl: './modifier-compte.css',
})
export class ModifierCompte {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly router = inject(Router);

  id = input.required<string>();

  protected readonly libellesRoles = LIBELLES_ROLES;
  protected readonly roles = Object.keys(LIBELLES_ROLES) as RoleName[];

  // undefined = chargement · null = compte introuvable
  protected readonly utilisateur = signal<Utilisateur | null | undefined>(undefined);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  // Carte Actions
  protected readonly nouveauRole = signal<RoleName | null>(null);
  protected readonly confirmerStatut = signal(false);
  private readonly toast = inject(ToastService); // messages de succès en bas de l'écran
  protected readonly erreurAction = signal<string | null>(null);

  // Mêmes règles que UtilisateurModificationDTO.java (mot de passe facultatif, 6 caractères min.)
  protected readonly formulaire = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: [''],
    motDePasse: ['', Validators.minLength(6)],
  });

  constructor() {
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
      .subscribe((u) => {
        this.utilisateur.set(u);
        this.nouveauRole.set(u?.roles[0] ?? null);
        if (u) {
          // On pré-remplit le formulaire avec les valeurs actuelles
          this.formulaire.patchValue({ prenom: u.prenom, nom: u.nom, telephone: u.telephone ?? '' });
        }
      });
  }

  // ===== Formulaire =====
  protected enregistrer(): void {
    const u = this.utilisateur();
    if (!u || this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.enCours.set(true);
    this.erreur.set(null);

    const v = this.formulaire.getRawValue();
    this.utilisateurService
      .modifier(u.id, {
        prenom: v.prenom,
        nom: v.nom,
        telephone: v.telephone || undefined,
        motDePasse: v.motDePasse || undefined, // vide = on garde l'ancien mot de passe
      })
      .subscribe({
        next: () => this.router.navigate(['/admin/personnel', u.id]),
        error: (e: HttpErrorResponse) => {
          this.erreur.set((e.error as ApiError | null)?.message ?? 'Enregistrement impossible.');
          this.enCours.set(false);
        },
      });
  }

  protected aUneErreur(champ: keyof typeof this.formulaire.controls): boolean {
    const c = this.formulaire.controls[champ];
    return c.touched && c.invalid;
  }

  // ===== Actions =====
  // PATCH /api/utilisateurs/{id}/role
  protected changerRole(): void {
    const u = this.utilisateur();
    const role = this.nouveauRole();
    if (!u || !role || role === u.roles[0]) {
      return;
    }
    this.erreurAction.set(null);
    this.utilisateurService.attribuerRole(u.id, role).subscribe({
      next: (maj) => {
        this.utilisateur.set(maj);
        this.toast.succes(`Rôle modifié : ${this.libellesRoles[role]}.`);
      },
      error: (e: HttpErrorResponse) => this.erreurAction.set((e.error as ApiError | null)?.message ?? 'Changement de rôle impossible.'),
    });
  }

  // PATCH /suspendre ou /activer
  protected changerStatut(): void {
    const u = this.utilisateur();
    this.confirmerStatut.set(false);
    if (!u) {
      return;
    }
    this.erreurAction.set(null);
    const action = u.actif ? this.utilisateurService.suspendre(u.id) : this.utilisateurService.activer(u.id);
    action.subscribe({
      next: (maj) => {
        this.utilisateur.set(maj);
        this.toast.succes(maj.actif ? 'Compte réactivé.' : 'Compte désactivé.');
      },
      error: (e: HttpErrorResponse) => this.erreurAction.set((e.error as ApiError | null)?.message ?? 'Action impossible.'),
    });
  }
}
