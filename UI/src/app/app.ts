import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginModalComponent } from './shared/components/login-modal/login-modal.component';
import { RegisterModalComponent } from './shared/components/register-modal/register-modal.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginModalComponent, RegisterModalComponent, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'UI';
}
