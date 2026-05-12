import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { WebService } from '../../services/web-service';
import { ToastService } from '../../services/toast-service';

/**
 * Create User Component for Application
 */
@Component({
  selector: 'app-createuser',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  providers: [WebService],
  templateUrl: './createuser.html',
  styleUrl: './createuser.css',
})
export class Createuser 
{

  /**
   * Form Group for user details (name, username, password, email)
   */
  userForm: any;

  /**
   * Constructor for createuser.ts file
   * @param webService, used to perform POST new user request to backend
   * @param formBuilder, used to construct reactive forms and validation
   * @param toastService, global service used for success and error messages
   * @param router, used to navigate to login page after successful creation of new user
   */
  constructor(private webService: WebService, private router: Router,private formBuilder: FormBuilder, private toast: ToastService)
  {

  }

  /**
   * Initialize function for reactive forms used in component
   * userForm - User Details (Name, username, password, email)
   * All text fields initialized with Validators.required
   */
  ngOnInit()
  {
    this.userForm = this.formBuilder.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPass: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Submit create user function that POSTs userForm data through the WebService to database
   * Success - reset userForm, display success message and navigate to login page
   * Error - log error to the console and display error message
   */
  onSubmit()
  { //check if password and confirm password fields are matching before submitting form
    if (!this.isMatching(this.userForm.value['password'], this.userForm.value['confirmPass']))
    {
      this.toast.add('Error. Ensure Passowrd and Confirm Password is matching.')
      return;
    }
    else
    {
      this.webService.createUser(this.userForm.value).subscribe((response: any) => 
      {
        this.toast.add('Success. New User Created.')
        this.userForm.reset();
        this.router.navigate(['']);
      },
      (error) =>
      {
        console.log(error);
        this.toast.add('error. Unable to create user');
        this.toast.add('error. Ensure username and email are unique')
      });
    }
  }

  /**
   * Checks the state of validity for a specific form control
   * True only returned if the control is not valid and has been interacted with by a user
   * @param control the name of the form control to check, e.g name, username, password
   * @returns true' if control is an error, otherwise false
   */
  isInvalid(control: any)
  {
    return this.userForm.controls[control].invalid && this.userForm.controls[control].touched;
  }

  /**
   * Checks if form has any input fields that have not been interated with be user
   * @returns 'true' if there is at least one 'pristine' input field, otherwise 'false'
   */
  isUntouched()
  {
    return this.userForm.controls.name.pristine || this.userForm.controls.username.pristine ||
      this.userForm.controls.password.pristine || this.userForm.controls.confirmPass.pristine || this.userForm.controls.email.pristine;
  }

  /**
   * Checks if current active form is invalid or incomplete, used to disable submit button
   * @returns 'true' if input fields are invalid or unTouched, otherwise 'false' for valid forms ready to submit
   */
  isIncomplete()
  {
    return this.isInvalid('name') || this.isInvalid('username') || this.isInvalid('password') ||
      this.isInvalid('confirmPass') || this.isInvalid('email') || this.isUntouched();
  }

  /**
   * Checks if password and confirmPass input fields contain the same value
   * @param password the original password entered by the user
   * @param confimrPass The confirmation passtword string to check against
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
