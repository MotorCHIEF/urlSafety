import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navigation } from './components/navigation/navigation';
import { ToastService } from './services/toast-service';

/**
 * Root compontent of Application 
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Navigation],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App 
{

  /**
   * Title of the application
   */
  protected readonly title = 'urlSafetyFE';

  /**
   * Constructor for App.ts file
   * @param toastService Global service for toast messages for success operation and error messages
   */
  constructor(public toastService: ToastService)
  {
    
  }
}
