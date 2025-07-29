import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AdminService, Courier, CreateCourierDto, UpdateCourierDto } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-courier-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: 'courier-management.component.html',
  styleUrls: ['./courier-management.component.scss']
})

export class CourierManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  couriers: Courier[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  submitting = false;
  selectedCourier: Courier | null = null;

  courierForm: FormGroup;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.courierForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      isAvailable: [true]
    });
  }

  ngOnInit() {
    this.loadCouriers();
    
    // Listen for courier changes
    this.adminService.couriersChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadCouriers());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCouriers() {
    this.loading = true;
    this.adminService.getCouriers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (couriers) => {
          this.couriers = couriers;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading couriers:', error);
          this.loading = false;
        }
      });
  }

  openCreateModal() {
    this.isEditing = false;
    this.selectedCourier = null;
    this.courierForm.reset();
    this.courierForm.patchValue({ isAvailable: true });
    this.courierForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.courierForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(courier: Courier) {
    this.isEditing = true;
    this.selectedCourier = courier;
    this.courierForm.patchValue({
      name: courier.name,
      email: courier.email,
      phone: courier.phone,
      isAvailable: courier.isAvailable
    });
    this.courierForm.get('password')?.clearValidators();
    this.courierForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.courierForm.reset();
    this.selectedCourier = null;
  }

  onSubmit() {
    if (this.courierForm.invalid) return;

    this.submitting = true;
    const formData = this.courierForm.value;

    if (this.isEditing && this.selectedCourier) {
      const updateData: UpdateCourierDto = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        isAvailable: formData.isAvailable
      };

      this.adminService.updateCourier(this.selectedCourier.id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModal();
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error updating courier:', error);
            this.submitting = false;
          }
        });
    } else {
      const createData: CreateCourierDto = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      };

      this.adminService.createCourier(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModal();
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error creating courier:', error);
            this.submitting = false;
          }
        });
    }
  }

  deleteCourier(courierId: string) {
    if (confirm('Are you sure you want to delete this courier?')) {
      this.adminService.deleteCourier(courierId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Courier deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting courier:', error);
          }
        });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PICKED': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

