import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { CustomerDashboardComponent } from './pages/customer-dashboard/customer-dashboard.component';
import { ParcelDetailsComponent } from './pages/parcel-details/parcel-details.component';
import { AdminUsersComponent } from './pages/admin-dashboard/users/admin-users.component';
import { AdminLayoutComponent } from './pages/admin-dashboard/dashboard-layout/admin-layout.component';
import { AdminDashboardHomeComponent } from './pages/admin-dashboard/dashboard-home/admin-dashboard-home.component';
import { AdminParcelsComponent } from './pages/admin-dashboard/parcels/admin-parcels.component';
import { AdminCreateParcelComponent } from './pages/admin-dashboard/create-parcel/admin-create-parcel.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'dashboard',
    component: CustomerDashboardComponent },
    { path: 'parcel/:orderId', component: ParcelDetailsComponent },
  { path: 'admin', component: AdminLayoutComponent, children: [
    { path: '', component: AdminDashboardHomeComponent },
    { path: 'users', component: AdminUsersComponent },
    { path: 'parcels', component: AdminParcelsComponent },
    { path: 'create-parcel', component: AdminCreateParcelComponent }
  ] },
];
