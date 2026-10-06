import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ParametreService } from '../../../core/api/parametre.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/models/api-error.model';

// Les deux mots de passe doivent être identiques
function motsDePasseIdentiques(groupe: AbstractControl): ValidationErrors | null {
  const mdp = groupe.get('motDePasse')?.value;
  const confirmation = groupe.get('confirmation')?.value;
  return mdp && confirmation && mdp !== confirmation ? { differents: true } : null;
}

// Choisir un nouveau mot de passe : /reinitialiser-mot-de-passe?jeton=… (lien reçu par e-mail)
@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reinitialiser-mot-de-passe.html',
  styleUrl: './reinitialiser-mot-de-passe.css',
})
export class ReinitialiserMotDePasse {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly logos = inject(ParametreService).logos; // logo choisi par le webmaster (Paramètres)
  private readonly authService = inject(AuthService);

  // Le jeton secret de ?jeton=… (withComponentInputBinding)
  jeton = input<string>();

  protected readonly formulaire = this.fb.group(
    {
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    },
    { validators: motsDePasseIdentiques },
  );

  protected readonly chargement = signal(false);
  protected readonly reussi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected enregistrer(): void {
    const jeton = this.jeton()?.trim();
    if (!jeton) {
      this.erreur.set("Ce lien est incomplet. Utilisez le lien reçu par e-mail, ou faites une nouvelle demande.");
      return;
    }
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.authService.reinitialiserMotDePasse(jeton, this.formulaire.getRawValue().motDePasse).subscribe({
      next: () => {
        this.reussi.set(true);
        this.chargement.set(false);
      },
      // Ex. : "Ce lien n'est plus valide. Faites une nouvelle demande de mot de passe oublié."
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Modification impossible. Réessayez.');
        this.chargement.set(false);
      },
    });
  }

  protected aUneErreur(champ: 'motDePasse' | 'confirmation'): boolean {
    const c = this.formulaire.controls[champ];
    return c.touched && c.invalid;
  }
}
