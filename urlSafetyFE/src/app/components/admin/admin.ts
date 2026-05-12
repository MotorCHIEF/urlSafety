import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebService } from '../../services/web-service';
import { ReactiveFormsModule, Validators, FormBuilder, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast-service';

/**
 * Admin Component for Application
 */
@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  providers: [WebService],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin 
{
  /**
   * currentForm - string variable used for two way binding to determin which form is currently begin used - delete user or delete url report from user
   */
  currentForm: string = 'user';

  /**
   * Form group for deleting user - userID
   */
  deleteUserForm: any;

  /**
   * Form group for deleting URL report from usr - userID and url
   */
  deleteURLForm: any;

  /**
   * Constructor for admin.ts file
   * @param webService, used to perform DELETE request to backend for deleting users and user url reports
   * @param formBuilder, used to onstruct forms and validatiion
   * @param toast, global service used for success and error messages
   */
  constructor(private webService: WebService, private formBuilder: FormBuilder, private toast: ToastService)
  {
    
  }

  /**
   * Initialize function for forms used in component
   * deleteUserForm - useID
   * deleteURLForm - userID and url
   * All text fields initialized with Validators.required
   */
  ngOnInit()
  {
    this.deleteUserForm = this.formBuilder.group({
      userID: ['', Validators.required]
    });

    this.deleteURLForm = this.formBuilder.group({
      userID: ['', Validators.required],
      url: ['', Validators.required]
    });
  }

  /**
   * Submit delete user function that DELETES user through the WEbService and backend to the database
   */
  onDeleteUser()
  {
    this.webService.deleteUser(this.deleteUserForm.value['userID']).subscribe((response :any) =>
    {
      this.toast.add('Success. User deleted.')
      this.deleteUserForm.reset();
    },
    (error) =>
    {
      this.toast.add('Error. Unable to delete user.')
    });
  }

  /**
   * Submit delete URL reports function that DELETES user url Report through the WEbService and backend to the database
   */
  onDeleteURL()
  {
    this.webService.deleteReport(this.deleteURLForm.value).subscribe((response :any) =>
    {
      this.toast.add('Success. User URL report deleted.')
      this.deleteURLForm.reset();
    },
    (error) =>
    {
      this.toast.add('Error. Unable to delete user URL report.')
    });
  }

  /**
   * Checks the state of validity for a specific form control
   * True only returned if the control is not valid and has been interacted with by an admin
   * Switch statement used to check which form is currently active based on currentForm variable and check validity of correct form controls
   * @param control the name of the form control to check, e.g userID, url
   * @returns true' if control is an error, otherwise false
   */
  isInvalid(control: any)
  {
    switch(this.currentForm)
    {
      case 'user':
        return this.deleteUserForm.controls[control].invalid && this.deleteUserForm.controls[control].touched;
      case 'url':
        return this.deleteURLForm.controls[control].invalid && this.deleteURLForm.controls[control].touched;
    }
  }

  /**
   * Checks if form has any input fields that have not been interated with be user
   * Switch statement used to check which form is currently active based on currentForm variable and check if there are any 'pristine' input fields in the active form
   * @returns 'true' if there is at least one 'pristine' input field, otherwise 'false'
   */
  isUntouched()
  {
    switch(this.currentForm)
    {
      case 'user':
        return this.deleteUserForm.controls.userID.pristine
      case 'url':
        return this.deleteURLForm.controls.userID.pristine || this.deleteURLForm.controls.url.pristine
    }
  }

  /**
   * Checks if current active form is invalid or incomplete, used to disable submit button
   * Switch statement used to check which form is currently active based on currentForm variable and check if the active form is invalid or has any 'pristine' input fields
   * @returns 'true' if input fields are invalid or unTouched, otherwise 'false' for valid forms ready to submit
   */
  isIncomplete()
  {
    switch(this.currentForm)
    {
      case 'user':
        return this.isInvalid('userID') || this.isUntouched()
      case 'url':
        return this.isInvalid('userID') || this.isInvalid('url') || this.isUntouched()
    }
  }
}
