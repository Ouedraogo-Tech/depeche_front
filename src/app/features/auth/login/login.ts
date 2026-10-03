import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { ApiError } from '../../../core/models/api-error.model';

// Page de connexion : email + mot de passe → token
//   - équipe  → son espace (/admin, /journaliste…)
//   - lecteur → la page qu'il lisait (?retour=/articles/5) ou l'accueil
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Page d'où vient le visiteur (ex. : "/articles/5"), pour l'y renvoyer après connexion
  retour = input<string>();

  // Le formulaire : chaque champ avec sa valeur de départ et ses règles
  protected readonly formulaire = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  protected readonly chargement = signal(false); // true pendant l'appel au backend
  protected readonly erreur = signal<string | null>(null); // message à afficher

  protected seConnecter(): void {
    // Formulaire incomplet : on affiche les erreurs sous les champs et on n'envoie rien
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    this.authService.connecter(this.formulaire.getRawValue()).subscribe({
      // Succès : un lecteur retourne à l'article qu'il lisait, l'équipe va dans son espace
      next: () => this.router.navigateByUrl(this.destination()),
      // Échec : on affiche le message du backend (format ApiError)
      error: (e: HttpErrorResponse) => {
        const message = (e.error as ApiError | null)?.message;
        this.erreur.set(message ?? 'Connexion impossible. Vérifiez que le serveur est lancé.');
        this.chargement.set(false);
      },
    });
  }

  // Où aller après la connexion
  private destination(): string {
    const r = this.retour();
    const retourSur = !!r && r.startsWith('/') && !r.startsWith('//'); // jamais vers un autre site
    return this.authService.aLeRole('LECTEUR') ? (retourSur ? r! : '/') : this.authService.cheminAccueil();
  }
}
