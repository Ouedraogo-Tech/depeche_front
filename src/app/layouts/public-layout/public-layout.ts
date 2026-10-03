import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

import { NewsletterService } from '../../core/api/newsletter.service';
import { ApiError } from '../../core/models/api-error.model';
import { FlashBar } from './components/flash-bar/flash-bar';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';

// Cadre des pages publiques : header + page + footer + carte newsletter
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, ReactiveFormsModule, Header, FlashBar, Footer],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly newsletterService = inject(NewsletterService);

  // ===== Carte newsletter : POST /api/newsletter/abonner (public) =====
  protected readonly formulaireNewsletter = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly envoiEnCours = signal(false);
  protected readonly messageNewsletter = signal<{ texte: string; succes: boolean } | null>(null);

  protected abonner(): void {
    if (this.formulaireNewsletter.invalid) {
      this.formulaireNewsletter.markAllAsTouched();
      this.messageNewsletter.set({ texte: 'Entrez une adresse e-mail valide.', succes: false });
      return;
    }
    this.envoiEnCours.set(true);
    this.messageNewsletter.set(null);

    const email = this.formulaireNewsletter.getRawValue().email.trim();
    this.newsletterService.abonner(email).subscribe({
      next: () => {
        this.messageNewsletter.set({ texte: 'Merci ! Vous recevrez notre prochaine newsletter.', succes: true });
        this.formulaireNewsletter.reset();
        this.envoiEnCours.set(false);
      },
      // Ex. : "Cet email est déjà abonné à la newsletter."
      error: (e: HttpErrorResponse) => {
        this.messageNewsletter.set({ texte: (e.error as ApiError | null)?.message ?? 'Inscription impossible, réessayez.', succes: false });
        this.envoiEnCours.set(false);
      },
    });
  }
}
