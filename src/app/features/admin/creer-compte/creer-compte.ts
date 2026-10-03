import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { UtilisateurService } from '../../../core/api/utilisateur.service';
import { ApiError } from '../../../core/models/api-error.model';
import { RoleType } from '../../../core/models/utilisateur.model';
import { Panel } from '../../../shared/ui/panel/panel';

// Page "Créer un compte" de l'administrateur (POST /api/utilisateurs)
@Component({
  selector: 'app-creer-compte',
  imports: [ReactiveFormsModule, RouterLink, Panel],
  templateUrl: './creer-compte.html',
  styleUrl: './creer-compte.css',
})
export class CreerCompte {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly router = inject(Router);

  // Les choix de la liste "Type de compte" : valeur envoyée au backend + texte affiché
  protected readonly typesDeCompte: { valeur: RoleType; libelle: string }[] = [
    { valeur: 'ROLE_JOURNALISTE', libelle: 'Journaliste' },
    { valeur: 'ROLE_RESPONSABLE_EDITORIAL', libelle: 'Responsable éditorial' },
    { valeur: 'ROLE_WEBMASTER', libelle: 'Webmaster' },
    { valeur: 'ROLE_ADMIN', libelle: 'Administrateur' },
    { valeur: 'ROLE_LECTEUR', libelle: 'Lecteur' },
  ];

  // Mêmes règles que UtilisateurRequestDTO.java (mot de passe : 6 caractères minimum)
  protected readonly formulaire = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: [''],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    typeUtilisateur: this.fb.control<RoleType>('ROLE_JOURNALISTE', Validators.required),
  });

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected creer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.erreur.set(null);

    const valeurs = this.formulaire.getRawValue();
    // Téléphone vide → on ne l'envoie pas
    this.utilisateurService.creer({ ...valeurs, telephone: valeurs.telephone || undefined }).subscribe({
      // Succès : retour au dashboard, où le nouveau compte apparaît dans le tableau
      next: () => this.router.navigate(['/admin/tableau-de-bord']),
      // Échec : message du backend (ex : "Cet email est déjà utilisé !")
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Création impossible.');
        this.enCours.set(false);
      },
    });
  }

  // Petit raccourci pour le HTML : le champ a-t-il une erreur à afficher ?
  protected aUneErreur(champ: keyof typeof this.formulaire.controls): boolean {
    const controle = this.formulaire.controls[champ];
    return controle.touched && controle.invalid;
  }
}
