import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NewsletterService } from '../../../core/api/newsletter.service';
import { Spinner } from '../../../shared/ui/spinner/spinner';

type Etat = 'en-cours' | 'fait' | 'invalide';

// Page ouverte par le lien "Se désabonner" des e-mails : /newsletter/desabonnement?jeton=…
@Component({
  selector: 'app-desabonnement',
  imports: [RouterLink, Spinner],
  templateUrl: './desabonnement.html',
  styleUrl: './desabonnement.css',
})
export class Desabonnement {
  private readonly newsletterService = inject(NewsletterService);

  // Le jeton secret de ?jeton=… (withComponentInputBinding)
  jeton = input<string>();

  protected readonly etat = signal<Etat>('en-cours');

  ngOnInit(): void {
    const jeton = this.jeton()?.trim();
    if (!jeton) {
      this.etat.set('invalide');
      return;
    }
    // POST /api/newsletter/desabonner?jeton=… : l'abonné passe "désabonné"
    this.newsletterService.desabonnerParJeton(jeton).subscribe({
      next: () => this.etat.set('fait'),
      error: () => this.etat.set('invalide'),
    });
  }
}
