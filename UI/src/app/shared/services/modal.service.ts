import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private loginVisible = new BehaviorSubject<boolean>(false);
  private registerVisible = new BehaviorSubject<boolean>(false);

  login$ = this.loginVisible.asObservable();
  register$ = this.registerVisible.asObservable();

  openLogin() {
    this.loginVisible.next(true);
    this.registerVisible.next(false);
  }

  openRegister() {
    this.registerVisible.next(true);
    this.loginVisible.next(false);
  }

  closeAll() {
    this.loginVisible.next(false);
    this.registerVisible.next(false);
  }

  isAnyOpen(): boolean {
    return this.loginVisible.getValue() || this.registerVisible.getValue();
  }
}
