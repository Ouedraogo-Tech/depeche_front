import { Component, input } from '@angular/core';

// Indicateur de chargement : un cercle qui tourne + un texte (« Chargement… » par défaut)
// Utilisation : <app-spinner />  ou  <app-spinner texte="Recherche en cours…" />
@Component({
  selector: 'app-spinner',
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-10 text-sm text-marine/60" role="status" aria-live="polite">
      <span class="h-8 w-8 animate-spin rounded-full border-4 border-sable border-t-brique"></span>
      <span>{{ texte() }}</span>
    </div>
  `,
  host: { class: 'block' },
})
export class Spinner {
  texte = input('Chargement…');
}
