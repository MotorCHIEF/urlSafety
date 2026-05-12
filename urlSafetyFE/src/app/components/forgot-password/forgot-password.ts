import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastService } from '../../services/toast-service';

/**
 * Forgot Password component for application
 */
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword 
{

  /**
   * Form Group for forgot password details - email
   */
  forgotPasswordForm: any;

  /**
   * Constructor for forgot-password.ts file
   * @param webService, used to perform POST forgot password request to backend
   * @param formBuilder, used to construct reactive forms and validation
   * @param toastService, global service used for success and error messages
   * @param router, used to navigate to login page after reset password request successfuly sent
   */
  constructor(private webService: WebService, private formBuilder: FormBuilder, private toast: ToastService, private router: Router)
  {
    
  }

  /**
   * Initialize function for reactive forms used in component
   * forgotPasswordForm - forgot password details - email
   * text field initialized with Validators.required and Validators.email
   */
  ngOnInit()
  {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Submit forgot password function that POSTs forgotPassswordForm data through the WebService to database
   * Success - reset forgotPasswordForm, display success message and navigate to login page
   * Error - display error message
   */
  onSubmit()
  {
    this.webService.forgotPassword(this.forgotPasswordForm.value).subscribe((response: any) =>
    {
      this.forgotPasswordForm.reset();
      this.toast.add('Success. Reset password email sent');
      this.router.navigate(['']);
    },
    (error) =>
    {
      this.toast.add('Error. Unable to send reset link try again')
    });
  }

  /**
   * Checks the state of validity for a specific form control
   * True only returned if the control is not valid and has been interacted with by a user
   * @param control the name of the form control to check, email
   * @returns true' if control is an error, otherwise false
   */
  isInvalid(control: any)
  {
    return this.forgotPasswordForm.controls[control].invalid && this.forgotPasswordForm.controls[control].touched;
  }

  /**
   * Checks if any input fields that have not been interated with be user
   * @returns 'true' if there is at least one 'pristine' input field, otherwise 'false'
   */
  isUntouched()
  {
    return this.forgotPasswordForm.controls.email.pristine
  }

  /**
   * Checks if is invalid or incomplete, used to disable submit button
   * @returns 'true' if input fields are invalid or unTouched, otherwise 'false' for valid forms ready to submit
   */
  isIncomplete()
  {
    return this.isInvalid('email') ||
      this.isUntouched();
  }
}
