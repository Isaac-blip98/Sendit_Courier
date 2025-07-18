import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { CustomerDashboardComponent } from './pages/customer-dashboard/customer-dashboard.component';
import { ParcelDetailsComponent } from './pages/parcel-details/parcel-details.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'dashboard',
    component: CustomerDashboardComponent },
    { path: 'parcel/:orderId', component: ParcelDetailsComponent }
];
