import { Component, computed, input } from '@angular/core';

import { StatutArticle } from '../../../core/models/article.model';
import { StatutCommentaire } from '../../../core/models/commentaire.model';

// Tous les statuts que la pastille sait afficher
export type StatutBadge = StatutArticle | StatutCommentaire | 'ACTIF' | 'DESACTIVE';

// Pour chaque statut : le texte affiché et les classes Tailwind de couleur
const BADGES: Record<StatutBadge, { libelle: string; couleur: string }> = {
  BROUILLON: { libelle: 'Brouillon', couleur: 'bg-sable/60 text-marine/80' },
  SOUMIS: { libelle: 'Soumis', couleur: 'bg-amber-100 text-amber-800' },
  A_REVISER: { libelle: 'À réviser', couleur: 'bg-red-100 text-red-700' },
  REFUSE: { libelle: 'Refusé', couleur: 'bg-red-100 text-red-700' },
  PUBLIE: { libelle: 'Publié', couleur: 'bg-green-100 text-green-800' },
  PLANIFIE: { libelle: 'Planifié', couleur: 'bg-blue-100 text-blue-800' },
  ARCHIVE: { libelle: 'Archivé', couleur: 'bg-gray-200 text-gray-700' },
  MASQUE: { libelle: 'Masqué', couleur: 'bg-red-100 text-red-700' },
  SUPPRIME: { libelle: 'Supprimé', couleur: 'bg-gray-200 text-gray-700' },
  ACTIF: { libelle: 'Actif', couleur: 'bg-green-100 text-green-800' },
  DESACTIVE: { libelle: 'Désactivé', couleur: 'bg-red-100 text-red-700' },
};

// Pastille colorée : PUBLIÉ, SOUMIS, À RÉVISER, ACTIF...
@Component({
  selector: 'app-status-badge',
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  statut = input.required<StatutBadge>();

  // Recalculé automatiquement à chaque fois que "statut" change
  protected readonly badge = computed(() => BADGES[this.statut()]);
}
