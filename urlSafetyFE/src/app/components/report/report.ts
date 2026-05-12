import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebService } from '../../services/web-service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast-service';

/**
 * Report Component for Application
 */
@Component({
  selector: 'app-report',
  imports: [CommonModule, RouterModule],
  providers: [WebService],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report 
{

  /**
   * reportList - variable to store reports retrieve from db and backend to be displayed
   */
  reportList: any;

  /**
   * reportID - variable to store reportID, users can view report-info page and return back to report page previously viewing
   */
  reportID: any;

  /**
   * Constructor for report.ts file
   * @param webService, used to perform GETs request to backend
   * @param route, used to get reportID from url 
   * @param toast , global service used for success and error messages
   */
  constructor(private webService: WebService, private route: ActivatedRoute, private toast: ToastService)
  {

  }

  /**
   * Intialize function for report component
   * GETS report from backend and db using reportID from url and sotres rpeort in reportList to be displayed
   * store current reportID in sessionStorage to allow user to return to report after viewing report-info page
   */
  ngOnInit()
  {
    this.reportID = this.route.snapshot.paramMap.get('id');

    this.webService.getReport(this.reportID).subscribe((response: any) =>
    {
      this.reportList = [response];
      sessionStorage.setItem('currentReport', this.reportID);
    },
    (error) =>
    {
      this.toast.add('Error. Unable to load Safety Report.')
    });
  }

  /**
   * getScoreClass function used to set the colour of the wheel that displayes the afety score of the report
   * @param score the safety score of the report used to determine the colour of the wheel
   * @returns green for safe, orange for suspicious and red for unsafe
   */
  getScoreClass(score: number): string 
  {
    if (score >= 70) 
      {
        return 'green';
      } 
    else if (score >= 40) 
      {
        return 'orange';
      } 
    else 
      {
        return 'red';  
      }
  }

  /**
   * getTextClass function used to set the colour of the text that displays the verdict of the report
   * @param score the safety score of the report used to determine the colour of the verdict text
   * @returns text-success (green) for safe, text-warning (orange) for suspicious and text-danger (red) for unsafe
   */
  getTextClass(score: number): string 
  {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  }
}