import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Article, ArticleRequest } from '../../../core/models/article.model';
import { Categorie } from '../../../core/models/categorie.model';
import { ImageUpload } from '../image-upload/image-upload';
import { MOTIF_LIEN_YOUTUBE, miniatureYoutube } from '../youtube';

// Formulaire d'article (journaliste ET responsable éditorial) : création OU modification.
// Il n'appelle PAS le backend : il prévient la page parente avec output().
@Component({
  selector: 'app-article-form',
  imports: [ReactiveFormsModule, ImageUpload],
  templateUrl: './article-form.html',
  styleUrl: './article-form.css',
})
export class ArticleForm {
  private readonly fb = inject(NonNullableFormBuilder);

  // Ce que la page parente donne au formulaire
  categories = input.required<Categorie[]>();
  article = input<Article | null>(null); // rempli = MODE MODIFICATION (formulaire pré-rempli)
  boutonSoumettre = input(true); // afficher "Soumettre pour validation" ?
  boutonPublier = input(true); // afficher "Publier l'article" ?
  enCours = input(false); // true pendant l'appel au backend
  erreur = input<string | null>(null); // message d'erreur du backend

  // Ce que le formulaire renvoie à la page parente (un output par bouton)
  brouillon = output<ArticleRequest>(); // "Enregistrer comme brouillon" / "Enregistrer les modifications"
  soumission = output<ArticleRequest>(); // "Soumettre pour validation"
  publication = output<ArticleRequest>(); // "Publier l'article"

  protected readonly modeModification = computed(() => this.article() !== null);

  // Mêmes règles que ArticleRequestDTO.java
  protected readonly formulaire = this.fb.group({
    titre: ['', [Validators.required, Validators.maxLength(150)]],
    resume: ['', Validators.maxLength(300)],
    contenu: ['', Validators.required],
    categorieId: this.fb.control<number | null>(null, Validators.required),
    image: [''],
    lienVideo: ['', [Validators.maxLength(255), Validators.pattern(MOTIF_LIEN_YOUTUBE)]], // facultatif
  });

  // Aperçu de la vidéo sous le champ (miniature YouTube), dès que le lien est valide
  private readonly valeurLienVideo = toSignal(this.formulaire.controls.lienVideo.valueChanges, { initialValue: '' });
  protected readonly miniatureVideo = computed(() =>
    this.formulaire.controls.lienVideo.valid ? miniatureYoutube(this.valeurLienVideo()) : null,
  );

  constructor() {
    // Mode modification : dès que l'article arrive, on remplit le formulaire avec ses valeurs
    effect(() => {
      const a = this.article();
      if (a) {
        this.formulaire.reset({
          titre: a.titre,
          resume: a.resume ?? '',
          contenu: a.contenu,
          categorieId: a.categorieId,
          image: a.image ?? '',
          lienVideo: a.lienVideo ?? '',
        });
      }
    });
  }

  protected envoyer(type: 'brouillon' | 'soumission' | 'publication'): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const valeurs = this.formulaire.getRawValue();
    // On transforme les valeurs du formulaire en ArticleRequest (champs vides → non envoyés)
    const article: ArticleRequest = {
      titre: valeurs.titre.trim(),
      contenu: valeurs.contenu,
      categorieId: valeurs.categorieId!,
      resume: valeurs.resume || undefined,
      image: valeurs.image || undefined,
      lienVideo: valeurs.lienVideo.trim(), // "" = pas de vidéo (ou vidéo retirée en modification)
    };

    if (type === 'brouillon') {
      this.brouillon.emit(article);
    } else if (type === 'soumission') {
      this.soumission.emit(article);
    } else {
      this.publication.emit(article);
    }
  }

  // Appelée par la page parente après un enregistrement réussi
  vider(): void {
    this.formulaire.reset();
  }

  protected aUneErreur(champ: keyof typeof this.formulaire.controls): boolean {
    const controle = this.formulaire.controls[champ];
    return controle.touched && controle.invalid;
  }
}
