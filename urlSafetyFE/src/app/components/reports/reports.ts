import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WebService } from '../../services/web-service';
import { map, Observable } from 'rxjs';
import { ToastService } from '../../services/toast-service';

/**
 * Reports Component for Application
 */
@Component({
  selector: 'app-reports',
  imports: [RouterModule, CommonModule,],
  providers: [WebService],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})

export class Reports 
{
  /**
   * reportList - variable to store reports retrieved from the backend
   */
  reportList: any = [];

  /**
   * totalReports - variable to store total number of reports retireved
   */
  totalReports: number = 0;

  /**
   * page - variavble to store current page number for pagintation
   */
  page: number = 1;

  /**
   * pageSize - limit to how many reports to display per page
   */
  pageSize: number = 10;

  /**
   * lastPage - variable used to stop users from going to next page if there are no more reports to display
   */
  lastPage: number = 1;

  /**
   * Constructor for report.ts file
   * @param webService, used to perform GETs request to backend
   * @param toast, global service used for success and error messages
   */
  constructor(protected webService: WebService, private toast: ToastService)
  {

  }

  /**
   * Intialize function for reports component
   * GETS reports from backend and db using page number and stores reports in reportList to be displayed
   * stores current page number in sessionStorage to allow user to return to page after viewing report
   */
  ngOnInit()
  {
    //this.lastPage = this.getLastPage();
    if(sessionStorage['page'])
    {
      this.page = Number(sessionStorage['page']);
    }

    this.webService.getReports(this.page).subscribe((response) =>
    {
      this.reportList = response.reports;
      this.totalReports = response.totalReports;
      this.lastPage = Math.ceil(this.totalReports / this.webService.pageSize);
    },
    (error) =>
    {
      this.toast.add('Error. Unable to load Safety Reports.')
    });
  }

  /**
   * previousPage - function to allow user to navigate to a previous pae of reports, if page > 1
   */
  previousPage()
  {
    if(this.page > 1)
    {
      this.page = this.page - 1;
      sessionStorage['page'] = this.page;
      this.webService.getReports(this.page).subscribe((response: any) =>
      {
        this.reportList = response.reports;
      },
      (error) =>
      {
        this.toast.add('Error. Unable to load Safety Reports.')
      });
    }
  }

  /**
   * nextPage - function to allow user to navigate to a next pae of reports, if page < lasstPage
   */
  nextPage()
  {
    if(this.page < this.lastPage)
    {
      this.page = this.page + 1;
      sessionStorage['page'] = this.page;
      this.webService.getReports(this.page).subscribe((response: any) =>
      {
        this.reportList = response.reports;
      },
      (error) =>
      {
        this.toast.add('Error. Unable to load Safety Reports.')
      });
    } 
  }

  //getLastPage()
  //{
  //  return Math.ceil(this.reportList.totalReports / this.webService.pageSize);
  //}

  /**
   * getTextClass - function to set text colour of safety verdict and safety score based on safety score value
   * @param score - safety score of the report used to determine colour of the text
   * @returns if score >= 70 returns text-success (green), if score >= 40 returns text-warning (orange) and if score < 40 returns text-danger (red)
   */
  getTextClass(score: number): string 
  {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  }
}

