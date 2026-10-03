import { Component, input, output } from '@angular/core';

// Fenêtre de confirmation : "Êtes-vous sûr ?" + Annuler / Confirmer
@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  // Ce que le parent ENVOIE au composant
  titre = input.required<string>();
  message = input.required<string>();
  libelleConfirmer = input('Confirmer');

  // Ce que le composant RENVOIE au parent
  confirme = output<void>(); // clic sur le bouton de confirmation
  annule = output<void>(); // clic sur Annuler ou à côté de la fenêtre
}
