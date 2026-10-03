import { Injectable, signal } from '@angular/core';

export interface MessageToast {
  id: number;
  texte: string;
  type: 'succes' | 'erreur';
}

const DUREE = 3500; // en millisecondes : le message disparaît tout seul

// Petits messages qui apparaissent en bas de l'écran (« ✓ Article publié »), utilisables depuis n'importe quelle page
// Utilisation : inject(ToastService).succes('Article publié.')
@Injectable({ providedIn: 'root' })
export class ToastService {
  private compteur = 0;
  private readonly _messages = signal<MessageToast[]>([]);
  readonly messages = this._messages.asReadonly();

  succes(texte: string): void {
    this.afficher(texte, 'succes');
  }

  erreur(texte: string): void {
    this.afficher(texte, 'erreur');
  }

  fermer(id: number): void {
    this._messages.update((liste) => liste.filter((m) => m.id !== id));
  }

  private afficher(texte: string, type: MessageToast['type']): void {
    const id = ++this.compteur;
    this._messages.update((liste) => [...liste, { id, texte, type }]);
    setTimeout(() => this.fermer(id), DUREE);
  }
}
