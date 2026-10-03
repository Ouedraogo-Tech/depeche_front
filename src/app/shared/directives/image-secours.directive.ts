import { Directive, ElementRef, inject } from '@angular/core';

// À ajouter sur une image : <img appImageSecours [src]="...">
// Si l'image est introuvable, on la cache → le fond "sable" du cadre s'affiche à la place.
@Directive({
  selector: 'img[appImageSecours]',
  host: { '(error)': 'cacher()' }, // écoute l'événement "error" de l'image
})
export class ImageSecours {
  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef);

  protected cacher(): void {
    this.image.nativeElement.style.display = 'none';
  }
}
