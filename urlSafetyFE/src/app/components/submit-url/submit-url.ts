import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastService } from '../../services/toast-service';

/**
 * Submit URL Component for Application
 */
@Component({
  selector: 'app-submit-url',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  providers: [WebService],
  templateUrl: './submit-url.html',
  styleUrl: './submit-url.css',
})

export class SubmitURL 
{

  /**
   * submitForm - url
   */
  submitForm: any;

  /**
   * isAnalysiing - boolean variable used to switch button text to show user that their URL is being analysed
   */
  isAnanlysing: boolean = false;

  /**
   * urlPattern - regex pattern used to validate url input field - checks if url is a vlaid format with http/https, an ip address and has a top level domain
   */
  urlPattern = /^((http|https):\/\/)?(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/i;
  
  /**
   * Constructor for submit-url.ts file
   * @param webService, used to perform POST url request to backend
   * @param formBuilder, used to construct reactive forms and validation
   * @param toastService, global service used for success and error messages
   * @param router, used to navigate to new report page after successful submission of url
   */
  constructor(private webService: WebService, private formBuilder: FormBuilder, private router: Router, private toast: ToastService)
  {

  }

  /**
   * Intialize function for submitForm - url
   * url field intialized with validators.required and Validators.pattern with urlPattern regex to validate url format
   */
  ngOnInit()
  {
    this.submitForm = this.formBuilder.group({
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]]
    });
  }

  /**
   * onSubmit function that POSTS submitForm data (url) through the Webservice to the backend to perform url safety analysis and report generation to add to db (report/reportCache collections)
   * Success - navigate user to new report page with report id returned from backend, reset submitForm and isAnalysisng to false and display success message
   * Error - log error to console, reset isAnalysing to false and display error message
   */
  onSubmit()
  {
    this.isAnanlysing = true;
    this.webService.submitURL(this.submitForm.value).subscribe((response : any) =>
    {
      this.toast.add('Success. Analysed URL.')
      this.isAnanlysing = false;
      this.submitForm.reset();
      
      if('_id' in response)
      {
        this.router.navigate(['/reports', response._id]);
      }
      else
      {
        let id = response.url.split("/");
        this.router.navigate(['/reports', id[id.length - 1]]);
      }
    },
    (error) =>
    {
      this.isAnanlysing = false;
      this.toast.add('Error. Unable to generate safety report. Ensure url is valid - contains http/https and a top-level domain and try again')
    });
  }

  /**
   * Checks the state of validity for a specific form control
   * True only returned if the control is not valid and has been interacted with by a user
   * @param control the name of the form control to check - url
   * @returns true' if control is an error, otherwise false
   */
  isInvalid(control:any)
  {
    return this.submitForm.controls[control].invalid && this.submitForm.controls[control].touched;
  }

  /**
   * Checks if form has any input fields that have not been interated with be user
   * @returns 'true' if there is at least one 'pristine' input field, otherwise 'false'
   */
  isUntouched()
  {
    return this.submitForm.controls.url.pristine;
  }

  /**
   * Checks if current active form is invalid or incomplete, used to disable submit button
   * @returns 'true' if input fields are invalid or unTouched, otherwise 'false' for valid forms ready to submit
   */
  isIncomplete()
  {
    return this.isInvalid('url') || this.isUntouched();
  }
}
