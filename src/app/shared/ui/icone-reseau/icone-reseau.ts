import { Component, input } from '@angular/core';

import { NomReseau } from '../../../core/models/parametre-site.model';

// Logo d'un réseau social (dessin SVG, couleur = couleur du texte autour : "currentColor")
// Utilisation : <app-icone-reseau nom="facebook" class="h-5 w-5" />
@Component({
  selector: 'app-icone-reseau',
  imports: [],
  template: `
    <svg viewBox="0 0 24 24" class="h-full w-full" fill="currentColor" aria-hidden="true">
      @switch (nom()) {
        @case ('facebook') {
          <circle cx="12" cy="12" r="11" />
          <path fill="var(--fond-icone, #0F1B33)" d="M13.4 21v-6.8h2.3l.4-2.7h-2.7V9.8c0-.8.2-1.3 1.3-1.3h1.4V6.1a19 19 0 0 0-2.1-.1c-2.1 0-3.5 1.3-3.5 3.6v1.9H8.2v2.7h2.3V21h2.9Z" />
        }
        @case ('youtube') {
          <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-4.8.5-4.8s0-3.2-.5-4.8Z" />
          <path fill="var(--fond-icone, #0F1B33)" d="M9.7 15.1V8.9l5.6 3.1-5.6 3.1Z" />
        }
        @case ('whatsapp') {
          <path d="M12 1.5A10.5 10.5 0 0 0 3 17.4L1.5 22.5l5.3-1.4A10.5 10.5 0 1 0 12 1.5Z" />
          <path fill="var(--fond-icone, #0F1B33)" d="M8.6 6.9c.3 0 .5 0 .7.5l.9 2c.1.3 0 .5-.1.7l-.7.8c.7 1.3 1.8 2.4 3.1 3.1l.8-.7c.2-.2.4-.2.7-.1l2 .9c.4.2.5.4.5.7 0 1.2-1 2.2-2.2 2.2-4 0-7.7-3.7-7.7-7.7 0-1.2 1-2.2 2-2.2Z" />
        }
        @case ('instagram') {
          <path d="M7 1.5h10A5.5 5.5 0 0 1 22.5 7v10a5.5 5.5 0 0 1-5.5 5.5H7A5.5 5.5 0 0 1 1.5 17V7A5.5 5.5 0 0 1 7 1.5Zm0 2A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5V7A3.5 3.5 0 0 0 17 3.5H7Zm5 3.9a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm5.3-3.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
        }
        @case ('linkedin') {
          <rect x="1.5" y="1.5" width="21" height="21" rx="3" />
          <path fill="var(--fond-icone, #0F1B33)" d="M5.5 9.5h2.9v9H5.5v-9Zm1.4-4.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4Zm3.3 4.4H13v1.2c.4-.7 1.3-1.4 2.7-1.4 2.9 0 3.4 1.9 3.4 4.3v4.9h-2.9v-4.3c0-1 0-2.4-1.5-2.4s-1.7 1.1-1.7 2.3v4.4h-2.8v-9Z" />
        }
      }
    </svg>
  `,
  host: { class: 'inline-block' },
})
export class IconeReseau {
  nom = input.required<NomReseau>();
}
