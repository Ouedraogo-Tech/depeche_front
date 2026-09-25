import { Component } from '@angular/core';

// Bandeau rouge "FLASH INFO" sous le header
@Component({
  selector: 'app-flash-bar',
  imports: [],
  templateUrl: './flash-bar.html',
  styleUrl: './flash-bar.css',
})
export class FlashBar {
  // Titres provisoires (repris de la maquette).
  // Plus tard : les derniers articles publiés (GET /api/articles/publies)
  protected readonly titres = [
    'Vols directs vers Abidjan dès lundi',
    'Coton — la campagne 2026 dépasse les prévisions de 11 %',
    'Étalons : liste des 26 joueurs retenus',
  ];
}
