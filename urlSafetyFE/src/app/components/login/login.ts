import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ToastService } from '../../services/toast-service';

/**
 * Login Component for application
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  providers: [WebService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login 
{

  /**
   * Form Group for Login details (name, password)
   */
  loginForm: any;

  /**
   * Constructor for login.ts file
   * @param webService, used to perform GET requests to backend
   * @param formBuilder, used to construct reactive forms and validation
   * @param router, used to navigate user to submitURL page
   * @param toastService, global service used for success and error messages
   */
  constructor(private webService: WebService, private formBuilder: FormBuilder, private router: Router, private toast: ToastService)
  {
    
  }

  /**
   * Initialize function for reactive forms used in component
   * loginForm - username, password
   * All text fields initialized with Validators.required
   */
  ngOnInit()
  {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  /**
   * Submits login function that GETs loginFom data through the webservice to the backend
   * Converts login details to Base 64 encoded format for authorization
   * Success - adds access token to seesionStorage and brings user to submitURL page
   * Error - Logs error to console and displays error message
  */
  onSubmit()
  {
    let authCred = window.btoa(this.loginForm.get('username').value + ':' + this.loginForm.get('password').value);
    this.webService.login(authCred).subscribe((response: any) =>
    {
      this.toast.add('Success. Login successful.')
      sessionStorage.setItem('x-access-token', response.token);
      this.router.navigate(['submitURL']);
      this.loginForm.reset();
      
    },
    (error) =>
    {
      console.log(error);
      this.toast.add('Error. Unable to Login. Ensure that Username and Password are correct');
    });
  }

  /**
   * Checks the state of validity for a specific form control
   * True only returned if the control is not valid and has been interacted with by a user
   * @param control the name of the form control to check, usernames, passwords
   * @returns true' if control is an error, otherwise false
   */
  isInvalid(control: any)
  {
    return this.loginForm.controls[control].invalid && this.loginForm.controls[control].touched;
  }

  /**
   * Checks if any input fields that have not been interated with be user
   * @returns 'true' if there is at least one 'pristine' input field, otherwise 'false'
   */
  isUntouched()
  {
    return this.loginForm.controls.username.pristine ||
      this.loginForm.controls.password.pristine;
  }

  /**
   * Checks if is invalid or incomplete, used to disable submit button
   * @returns 'true' if input fields are invalid or unTouched, otherwise 'false' for valid forms ready to submitm
   */
  isIncomplete()
  {
    return this.isInvalid('username') ||
      this.isInvalid('password') ||
      this.isUntouched();
  }
}
