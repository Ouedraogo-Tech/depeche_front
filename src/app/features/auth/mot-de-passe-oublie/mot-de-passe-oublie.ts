import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/models/api-error.model';

// "Mot de passe oublié" : /mot-de-passe-oublie (page seule, comme la connexion)
// Réservé aux lecteurs et aux administrateurs ; les autres membres de l'équipe passent par l'administrateur.
@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: './mot-de-passe-oublie.css',
})
export class MotDePasseOublie {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly formulaire = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly chargement = signal(false);
  protected readonly envoye = signal(false); // true = message de confirmation affiché
  protected readonly erreur = signal<string | null>(null);

  protected envoyer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.authService.demanderReinitialisation(this.formulaire.getRawValue().email.trim()).subscribe({
      next: () => {
        this.envoye.set(true);
        this.chargement.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.erreur.set((e.error as ApiError | null)?.message ?? 'Envoi impossible. Réessayez dans un instant.');
        this.chargement.set(false);
      },
    });
  }
}
