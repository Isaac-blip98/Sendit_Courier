import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminService,
  AdminUser,
} from '../../../shared/services/admin.service';
import { FormsModule } from '@angular/forms';

declare var google: any;

@Component({
  selector: 'app-admin-create-parcel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-parcel.component.html',
  styleUrls: ['./admin-create-parcel.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminCreateParcelComponent implements OnInit {
  @ViewChild('pickupInput', { static: false }) pickupInput!: ElementRef;
  @ViewChild('destinationInput', { static: false }) destinationInput!: ElementRef;

  users: AdminUser[] = [];
  senderId: string = '';
  receiverId: string = '';
  receiverName: string = '';
  receiverPhone: string = '';
  pickupAddress: string = '';
  destination: string = '';
  weightCategory: string = '';
  loading = false;
  successMsg = '';
  errorMsg = '';

  private pickupAutocomplete: any;
  private destinationAutocomplete: any;

  constructor(
    private adminService: AdminService,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    // Load users
    this.adminService.getDashboardUsers().subscribe((users) => {
      this.users = users.filter((u) => u.status === 'active');
    });

    // Initialize Google Maps Places API
    await this.initializeGoogleMaps();
  }

  ngAfterViewInit(): void {
    // Initialize autocomplete after view is ready
    setTimeout(() => {
      this.initializeAutocomplete();
    }, 1000);
  }

  private async initializeGoogleMaps(): Promise<void> {
    try {
      if (typeof google !== 'undefined') {
        await google.maps.importLibrary('places');
        console.log('Google Maps Places API loaded successfully');
      } else {
        console.error('Google Maps API not loaded');
        this.errorMsg = 'Google Maps API not available. Please check your API key.';
      }
    } catch (error) {
      console.error('Error loading Google Maps Places API:', error);
      this.errorMsg = 'Failed to load Google Maps. Please check your API key.';
    }
  }

  private initializeAutocomplete(): void {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.error('Google Maps Places API not loaded');
      return;
    }

    // Initialize pickup autocomplete
    if (this.pickupInput) {
      this.pickupAutocomplete = new google.maps.places.Autocomplete(
        this.pickupInput.nativeElement,
        {
          types: ['address'],
          componentRestrictions: { country: 'ke' } // Restrict to Kenya, change as needed
        }
      );

      this.pickupAutocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = this.pickupAutocomplete.getPlace();
          if (place && place.formatted_address) {
            this.pickupAddress = place.formatted_address;
            console.log('Pickup address set to:', this.pickupAddress);
          }
        });
      });
    }

    // Initialize destination autocomplete
    if (this.destinationInput) {
      this.destinationAutocomplete = new google.maps.places.Autocomplete(
        this.destinationInput.nativeElement,
        {
          types: ['address'],
          componentRestrictions: { country: 'ke' } // Restrict to Kenya, change as needed
        }
      );

      this.destinationAutocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = this.destinationAutocomplete.getPlace();
          if (place && place.formatted_address) {
            this.destination = place.formatted_address;
            console.log('Destination set to:', this.destination);
          }
        });
      });
    }
  }

  createParcel() {
    console.log('Create Parcel called', {
      senderId: this.senderId,
      receiverId: this.receiverId,
      receiverName: this.receiverName,
      receiverPhone: this.receiverPhone,
      pickupAddress: this.pickupAddress,
      destination: this.destination,
      weightCategory: this.weightCategory,
    });
    
    this.successMsg = '';
    this.errorMsg = '';
    
    if (
      !this.senderId ||
      !this.receiverId ||
      !this.receiverName ||
      !this.receiverPhone ||
      !this.pickupAddress ||
      !this.destination ||
      !this.weightCategory
    ) {
      this.errorMsg = 'Please fill all required fields.';
      return;
    }
    
    this.loading = true;
    this.adminService
      .createParcel({
        senderId: this.senderId,
        receiverId: this.receiverId,
        receiverName: this.receiverName,
        receiverPhone: this.receiverPhone,
        pickupAddress: this.pickupAddress,
        destination: this.destination,
        weightCategory: this.weightCategory,
      })
      .subscribe({
        next: () => {
          this.successMsg = 'Parcel created successfully!';
          this.loading = false;
          this.resetForm();
        },
        error: (err) => {
          console.error('Error creating parcel:', err);
          this.errorMsg = 'Failed to create parcel. Please try again.';
          this.loading = false;
        },
      });
  }

  private resetForm(): void {
    this.senderId = '';
    this.receiverId = '';
    this.receiverName = '';
    this.receiverPhone = '';
    this.pickupAddress = '';
    this.destination = '';
    this.weightCategory = '';
    
    // Clear the input fields
    if (this.pickupInput) {
      this.pickupInput.nativeElement.value = '';
    }
    if (this.destinationInput) {
      this.destinationInput.nativeElement.value = '';
    }
  }

  // These methods are kept for backward compatibility if using web components
  onPickupPlaceSelected(event: any) {
    console.log('Pickup place selected:', event);
    const place = event.detail;
    
    if (place) {
      this.pickupAddress = 
        place.formatted_address || 
        place.displayName || 
        place.name || 
        place.vicinity || 
        '';
      
      console.log('Pickup address set to:', this.pickupAddress);
    }
  }

  onDestinationSelected(event: any) {
    console.log('Destination place selected:', event);
    const place = event.detail;
    
    if (place) {
      this.destination = 
        place.formatted_address || 
        place.displayName || 
        place.name || 
        place.vicinity || 
        '';
      
      console.log('Destination set to:', this.destination);
    }
  }
}