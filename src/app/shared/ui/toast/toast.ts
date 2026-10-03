import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

// Zone d'affichage des toasts : placée UNE seule fois, dans app.html
// Téléphone : en bas, sur toute la largeur · ordinateur : en bas à droite
@Component({
  selector: 'app-toast',
  imports: [],
  template: `
    <div class="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:w-96" aria-live="polite">
      @for (m of toastService.messages(); track m.id) {
        <div
          class="toast pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg"
          [class]="m.type === 'succes' ? 'bg-green-700' : 'bg-brique'"
          role="status"
        >
          <span>{{ m.type === 'succes' ? '✓' : '⚠' }}</span>
          <span class="min-w-0 flex-1 break-words">{{ m.texte }}</span>
          <button type="button" (click)="toastService.fermer(m.id)" class="opacity-70 hover:opacity-100" aria-label="Fermer">✕</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast {
      animation: apparaitre 0.25s ease-out;
    }
    @keyframes apparaitre {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class Toast {
  protected readonly toastService = inject(ToastService);
}
