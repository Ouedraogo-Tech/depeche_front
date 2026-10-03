import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

// Carte « rien à afficher » : une icône, un message et, si besoin, un lien d'action
// Utilisation : <app-empty-state message="Aucun article." lienTexte="+ Nouvel article" lien="/journaliste/nouvel-article" />
@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-sable bg-white px-6 py-10 text-center">
      <span class="text-3xl" aria-hidden="true">{{ icone() }}</span>
      <p class="max-w-md text-sm text-marine/60">{{ message() }}</p>
      @if (lien() && lienTexte()) {
        <a [routerLink]="lien()" class="mt-2 rounded-md bg-brique px-4 py-2 text-xs font-bold uppercase text-white hover:opacity-90">
          {{ lienTexte() }}
        </a>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class EmptyState {
  message = input.required<string>();
  icone = input('📭');
  lien = input<string | null>(null); // adresse du bouton (facultatif)
  lienTexte = input<string | null>(null); // texte du bouton (facultatif)
}
