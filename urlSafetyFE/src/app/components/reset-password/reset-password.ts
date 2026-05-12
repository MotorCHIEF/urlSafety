import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WebService } from '../../services/web-service';
import { ToastService } from '../../services/toast-service';
import { ActivatedRoute } from '@angular/router';

/**
 * reset password component for application
 */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  providers: [WebService],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword 
{

  /**
   * Form Group for forgot password details - password, confirmPass
   */
  resetPasswordForm: any;

  /**
   * Constructor for forgot-password.ts file
   * @param webService, used to perform POST forgot password request to backend
   * @param formBuilder, used to construct reactive forms and validation
   * @param toastService, global service used for success and error messages
   * @param router, used to navigate to login page after reset password request successfuly sent
   * @param route, used to get token value from url
   */
  constructor(private webService: WebService, private router: Router,private formBuilder: FormBuilder, private toast: ToastService, private route: ActivatedRoute)
  {

  }

  /**
   * Initialize function for reactive forms used in component
   * resetPasswordForm - reset password details - token, password, confirmPass
   * texts field initialized with Validators.required
   */
  ngOnInit()
  {
    this.resetPasswordForm = this.formBuilder.group({
      token : this.route.snapshot.paramMap.get('token'),
      password: ['', Validators.required],
      confirmPass: ['', Validators.required]
    });
  }

  /**
   * Submit rset password function that PUTs resetPassswordForm data through the WebService to database
   * Success - reset resetPasswordForm, display success message and navigate to login page
   * Error - display error message
   */
  onSubmit()
  { //check if password and confirm password fields are matching before submitting form
    if (!this.isMatching(this.resetPasswordForm.value['password'], this.resetPasswordForm.value['confirmPass']))
    {
      this.toast.add('Error. Ensure Passowrd and Confirm Password is matching.')
      return;
    }
    else
    {
      this.webService.resetPassword(this.resetPasswordForm.value).subscribe((response: any) => 
      {
        this.toast.add('Success. Password Updated.')
        this.resetPasswordForm.reset();
        this.router.navigate(['']);
      },
      (error) =>
      {
        console.log(error);
        this.toast.add('error. Unable to update password');
      });
    }
  }

  /**
   * Checks the state of validity for a specific form control
   * True only returned if the control is not valid and has been interacted with by a user
   * @param control the name of the form control to check, e.gpassword
   * @returns true' if control is an error, otherwise false
   */
  isInvalid(control: any)
  {
    return this.resetPasswordForm.controls[control].invalid && this.resetPasswordForm.controls[control].touched;
  }

  /**
   * Checks if form has any input fields that have not been interated with be user
   * @returns 'true' if there is at least one 'pristine' input field, otherwise 'false'
   */
  isUntouched()
  {
    return this.resetPasswordForm.controls.password.pristine || this.resetPasswordForm.controls.confirmPass.pristine
  }

  /**
   * Checks if current active form is invalid or incomplete, used to disable submit button
   * @returns 'true' if input fields are invalid or unTouched, otherwise 'false' for valid forms ready to submit
   */
  isIncomplete()
  {
    return this.isInvalid('password') ||
      this.isInvalid('confirmPass') || this.isUntouched();
  }

  /**
   * Checks if password and confirmPass input fields contain the same value
   * @param password the original password entered by the user
   * @param confimrPass The confirmation password string to check against
   * @returns 'true if password and confirmPass have the same value, returns 'false' and disables submit button if password and confirmPass differ
   */
  isMatching(password: string, confimrPass: string)
  {
    if (password !== confimrPass)
    {
      return false
    }
    else
    {
      return true;
    }
  }
}
