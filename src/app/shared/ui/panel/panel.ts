import { Component, input } from '@angular/core';

// Grande carte blanche avec un titre : "Gestion du personnel", "Valider un article"...
@Component({
  selector: 'app-panel',
  imports: [],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class Panel {
  titre = input<string>(); // facultatif
}
