import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/models/api-error.model';

// Les deux mots de passe doivent être identiques (règle sur le GROUPE, pas sur un champ)
function motsDePasseIdentiques(groupe: AbstractControl): ValidationErrors | null {
  const mdp = groupe.get('motDePasse')?.value;
  const confirmation = groupe.get('confirmation')?.value;
  return mdp && confirmation && mdp !== confirmation ? { differents: true } : null;
}

// Créer un compte LECTEUR : /inscription (?retour=/articles/5 pour revenir à l'article après)
@Component({
  selector: 'app-inscription',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class Inscription {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Page d'où vient le visiteur (ex. : "/articles/5")
  retour = input<string>();

  // Mêmes règles que InscriptionRequestDTO.java
  protected readonly formulaire = this.fb.group(
    {
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    },
    { validators: motsDePasseIdentiques },
  );

  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected creerCompte(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);

    const v = this.formulaire.getRawValue();
    this.authService
      .inscrire({
        prenom: v.prenom.trim(),
        nom: v.nom.trim(),
        email: v.email.trim(),
        telephone: v.telephone.trim() || undefined,
        motDePasse: v.motDePasse,
      })
      .subscribe({
        // Compte créé ET connecté : retour à l'article (ou à l'accueil)
        next: () => this.router.navigateByUrl(this.destinationSure()),
        error: (e: HttpErrorResponse) => {
          // Ex. : "Cet email est déjà utilisé !"
          this.erreur.set((e.error as ApiError | null)?.message ?? 'Création du compte impossible.');
          this.chargement.set(false);
        },
      });
  }

  // Sécurité : on n'accepte qu'une adresse DU SITE ("/articles/5"), jamais "https://autre-site.com"
  private destinationSure(): string {
    const r = this.retour();
    return r && r.startsWith('/') && !r.startsWith('//') ? r : '/';
  }

  protected aUneErreur(champ: keyof typeof this.formulaire.controls): boolean {
    const c = this.formulaire.controls[champ];
    return c.touched && c.invalid;
  }
}
