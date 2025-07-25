import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertService } from '../services/alert.service';
import { Subscription, timer } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-alert',
  templateUrl: './alert.component.html',
})
export class AlertComponent implements OnInit, OnDestroy {
  message: string = '';
  type: 'success' | 'error' = 'success';
  isVisible = false;
  private alertSub?: Subscription;
  private autoDismissSub?: Subscription;

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.alertSub = this.alertService.alert$.subscribe(alert => {
      this.message = alert.message;
      this.type = alert.type;
      this.isVisible = true;
      if (this.autoDismissSub) {
        this.autoDismissSub.unsubscribe();
      }
      this.autoDismissSub = timer(3000).subscribe(() => this.close());
    });
  }

  close() {
    this.isVisible = false;
  }

  ngOnDestroy() {
    this.alertSub?.unsubscribe();
    this.autoDismissSub?.unsubscribe();
  }
}
