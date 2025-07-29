import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { AdminParcel, AdminService, AssignCourierDto, Courier } from '../../../../shared/services/admin.service';

@Component({
  selector: 'app-parcel-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parcel-assignment.component.html',
  styleUrls: ['./parcel-assignment.component.scss']
})
export class ParcelAssignmentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  parcels: AdminParcel[] = [];
  filteredParcels: AdminParcel[] = [];
  availableCouriers: Courier[] = [];
  allCouriers: Courier[] = []; // Store all couriers for reassignment
  loading = true;
  
  showAssignmentModal = false;
  isReassigning = false;
  submitting = false;
  selectedParcel: AdminParcel | null = null;
  currentFilter = 'unassigned';

  assignmentForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.assignmentForm = this.fb.group({
      courierId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadData();
    
    // Listen for parcel changes
    this.adminService.parcelsChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadParcels());

    // Listen for courier changes
    this.adminService.couriersChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadCouriers());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      parcels: this.adminService.getParcels(),
      availableCouriers: this.adminService.getAvailableCouriers(),
      allCouriers: this.adminService.getCouriers() // Get all couriers for reassignment
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ parcels, availableCouriers, allCouriers }) => {
        this.parcels = parcels;
        this.availableCouriers = availableCouriers;
        this.allCouriers = allCouriers;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading = false;
        alert('Failed to load data. Please refresh the page.');
      }
    });
  }

  loadParcels() {
    this.adminService.getParcels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parcels) => {
          this.parcels = parcels;
          this.applyFilter();
        },
        error: (error) => {
          console.error('Error loading parcels:', error);
        }
      });
  }

  loadCouriers() {
    forkJoin({
      availableCouriers: this.adminService.getAvailableCouriers(),
      allCouriers: this.adminService.getCouriers()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ availableCouriers, allCouriers }) => {
        this.availableCouriers = availableCouriers;
        this.allCouriers = allCouriers;
      },
      error: (error) => {
        console.error('Error loading couriers:', error);
      }
    });
  }

  filterParcels(event: any) {
    this.currentFilter = event.target.value;
    this.applyFilter();
  }

  applyFilter() {
    switch (this.currentFilter) {
      case 'unassigned':
        this.filteredParcels = this.parcels.filter(p => !p.assignedCourierId);
        break;
      case 'assigned':
        this.filteredParcels = this.parcels.filter(p => p.assignedCourierId);
        break;
      default:
        this.filteredParcels = [...this.parcels];
    }
  }

  openAssignmentModal(parcel: AdminParcel) {
    this.selectedParcel = parcel;
    this.isReassigning = false;
    this.assignmentForm.reset();
    this.showAssignmentModal = true;
    
    // For new assignments, reload available couriers
    this.loadAvailableCouriers();
  }

  openReassignmentModal(parcel: AdminParcel) {
    this.selectedParcel = parcel;
    this.isReassigning = true;
    this.assignmentForm.patchValue({
      courierId: parcel.assignedCourierId || ''
    });
    this.showAssignmentModal = true;
    
    // For reassignment, we need all couriers (not just available ones)
    this.loadAllCouriers();
  }

  private loadAvailableCouriers() {
    this.adminService.getAvailableCouriers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (couriers) => {
          this.availableCouriers = couriers;
        },
        error: (error) => {
          console.error('Error loading available couriers:', error);
        }
      });
  }

  private loadAllCouriers() {
    this.adminService.getCouriers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (couriers) => {
          this.allCouriers = couriers;
          // For reassignment modal, show all couriers
          this.availableCouriers = couriers;
        },
        error: (error) => {
          console.error('Error loading all couriers:', error);
        }
      });
  }

  closeAssignmentModal() {
    this.showAssignmentModal = false;
    this.selectedParcel = null;
    this.assignmentForm.reset();
    this.submitting = false;
    this.isReassigning = false;
  }

  selectCourier(courierId: string) {
    this.assignmentForm.patchValue({ courierId });
  }

  onAssignSubmit() {
    console.log('=== Assignment Form Submit ===');
    console.log('Form valid:', this.assignmentForm.valid);
    console.log('Form values:', this.assignmentForm.value);
    console.log('Form errors:', this.assignmentForm.errors);
    console.log('CourierId control errors:', this.assignmentForm.get('courierId')?.errors);
    console.log('Selected parcel:', this.selectedParcel);
    console.log('Is reassigning:', this.isReassigning);

    // Validate form and parcel selection
    if (this.assignmentForm.invalid || !this.selectedParcel) {
      console.error('Form validation failed');
      this.assignmentForm.markAllAsTouched();
      
      if (!this.selectedParcel) {
        alert('No parcel selected. Please try again.');
        return;
      }
      
      const courierIdControl = this.assignmentForm.get('courierId');
      if (courierIdControl?.hasError('required')) {
        alert('Please select a courier.');
        return;
      }
      
      return;
    }

    const courierId = this.assignmentForm.get('courierId')?.value;
    if (!courierId) {
      console.error('No courier ID found in form');
      alert('Please select a courier.');
      return;
    }

    // Prevent double submission
    if (this.submitting) {
      console.log('Already submitting, ignoring duplicate request');
      return;
    }

    this.submitting = true;
    const assignmentData: AssignCourierDto = {
      parcelId: this.selectedParcel.id,
      courierId: courierId
    };

    console.log('Sending assignment data:', assignmentData);
    console.log('Using method:', this.isReassigning ? 'assignCourier (reassign)' : 'assignCourier (new)');

    // Always use the same method - the backend will handle both assignment and reassignment
    this.adminService.assignCourier(assignmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Assignment successful:', response);
          this.closeAssignmentModal();
          this.loadParcels(); // Refresh the parcels list
          this.loadCouriers(); // Refresh courier availability
          
          const action = this.isReassigning ? 'reassigned' : 'assigned';
          alert(`Courier ${action} successfully!`);
        },
        error: (error) => {
          console.error('Error assigning courier:', error);
          this.submitting = false;
          
          // Enhanced error handling
          let errorMessage = 'Failed to assign courier. ';
          
          if (error.status === 404) {
            errorMessage += 'Parcel or courier not found.';
          } else if (error.status === 400) {
            if (error.error?.message) {
              errorMessage += error.error.message;
            } else {
              errorMessage += 'Invalid request data or courier not available.';
            }
          } else if (error.status === 500) {
            errorMessage += 'Server error. Please try again later.';
          } else if (error.status === 0) {
            errorMessage += 'Network error. Please check your connection.';
          } else {
            errorMessage += `Server returned error ${error.status}. Please try again.`;
          }
          
          alert(errorMessage);
        }
      });
  }

  unassignCourier(parcel: AdminParcel) {
    if (!confirm('Are you sure you want to unassign the courier from this parcel?')) {
      return;
    }

    console.log('Unassigning courier from parcel:', parcel.id);
    
    this.adminService.unassignCourier(parcel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Courier unassigned successfully:', response);
          this.loadParcels(); // Refresh the parcels list
          this.loadCouriers(); // Refresh courier availability
          alert('Courier unassigned successfully!');
        },
        error: (error) => {
          console.error('Error unassigning courier:', error);
          
          let errorMessage = 'Failed to unassign courier. ';
          if (error.status === 404) {
            errorMessage += 'Parcel not found.';
          } else if (error.status === 400) {
            errorMessage += error.error?.message || 'Invalid request or no courier assigned.';
          } else if (error.status === 500) {
            errorMessage += 'Server error. Please try again later.';
          } else {
            errorMessage += 'Please try again.';
          }
          
          alert(errorMessage);
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PICKED': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper method to get couriers for the modal (available for new assignments, all for reassignments)
  getModalCouriers(): Courier[] {
    return this.isReassigning ? this.allCouriers : this.availableCouriers;
  }

  // Helper method to check if a courier should be disabled in the modal
  isCourierDisabled(courier: Courier): boolean {
    // For new assignments, only show available couriers (already filtered)
    // For reassignments, allow selection of any courier but show availability status
    return false; // Let users select any courier, the backend will validate
  }
}