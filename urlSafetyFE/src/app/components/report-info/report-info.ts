import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

/**
 * Report Info Component for Application
 */
@Component({
  selector: 'app-report-info',
  imports: [CommonModule, RouterModule],
  templateUrl: './report-info.html',
  styleUrl: './report-info.css',
})
export class ReportInfo 
{
  /**
   * Constructor for report-info.ts file
   * @param router, used to navigate user back to reprort page previously viewing
   */
  constructor(private router: Router)
  {

  }

  /**
   * Back function navigates user back to report previously viewing by getting the current report from sessionStorage and navigating to that report
   */
  back()
  {
    this.router.navigate(['/reports/'+sessionStorage.getItem('currentReport')]);
  }
}
