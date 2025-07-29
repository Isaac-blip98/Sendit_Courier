import { Directive, ElementRef, EventEmitter, NgZone, OnInit, Output } from '@angular/core';

// Declare google variable for TypeScript
declare var google: any;

@Directive({
  selector: '[appGooglePlaces]'
})
export class GooglePlacesDirective implements OnInit {
  @Output() placeSelected = new EventEmitter<string>();

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    const input = this.el.nativeElement;
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['geocode'] // Can be modified to ['address'], ['establishment'], etc.
    });

    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          this.placeSelected.emit(place.formatted_address);
        }
      });
    });
  }
}
