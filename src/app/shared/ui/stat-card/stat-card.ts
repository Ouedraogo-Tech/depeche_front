import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// Carte chiffrée des dashboards : "1 204 UTILISATEURS"
@Component({
  selector: 'app-stat-card',
  imports: [DecimalPipe],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  valeur = input.required<number>(); // le gros chiffre (obligatoire)
  libelle = input.required<string>(); // le texte en majuscules (obligatoire)
  detail = input<string>(); // petit texte après le libellé (facultatif), ex : "+3 ce mois-ci"
  accent = input(false); // true = liseré rouge en haut de la carte
}
