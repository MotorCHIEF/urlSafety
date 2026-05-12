import { Component } from '@angular/core';
import { WebService } from '../../services/web-service';
import { NgStyle } from '@angular/common';

/**
 * Component to test the functionality of the web service.
 */
@Component({
  selector: 'app-test-web-service',
  imports: [],
  providers: [WebService],
  templateUrl: './test-web-service.html',
  styleUrl: './test-web-service.css',
})
export class TestWebService 
{
  /**
   * testOutput - variable to hold results of tests
   */
  testOutput: string[] = [];

  /**
   * varialble to hold first page of report retireved
   */
  firstReportList: any[] = [];

  /**
   * variable to hold second page of reports retrieved
   */
  secondReportList: any[] = [];

  /**
   * variable to store test user ID
   */
  testUserID: string = '';

  /**
   * variable to store test url ID
   */
  testURLID: string = '';

  /**
   * variable to hold admin ID
   */
  testAdminID: string = '6993b9fccb7f5824a3489c47';

  /**
   * Variable to hold reset password token
   */
  testToken: string = '';

  /**
   * Constructor for the web test componnt
   * @param webService, the web service to make calls to the backend
   */
  constructor(private webService: WebService) 
  {

  }

  /**
   * Initialze function that calls tests for web service functionality.
   * Tests delayed to ensure tests with dependencies are called after dependent tests
   */
  ngOnInit()
  {
    this.testCreateUser();
    this.testAdminlogin();
    this.testforgotPassword();

    setTimeout(() => {
      this.testReportsRetrived();
      this.testPagesOfReportsAreDifferent();
      this.testSubmitURL();
      this.testRetieveReport();
    }, 3000);
    
    setTimeout(() =>
    {
      this.testDeleteReport();
      this.testDeleteUser();
      this.testResetPassword();
    }, 8000);

    setTimeout(() =>
    {
      this.testLogout(); 
    }, 12000); 
  }

  /**
   * testCreateUser function - test the ability to create a new user in the frontend by sending, request with new user data to the backend and checking if response confirms user creation
   */
  private testCreateUser()
  {
    let testUser = 
    {
      'name' : 'Test Name',
      'username' : 'TestUsername',
      'password' : 'testPassword',
      'email' : 'test@test.com'
    };

    this.webService.createUser(testUser).subscribe((response: any) =>
    {
      if(response && response.created)
      {
        console.log(response);
        this.testOutput.push('Add New User: PASS');
        let urlID = response.created.split('/');
        this.testUserID = urlID[urlID.length - 1];
      } 
      else
      {
        console.log(response);
        this.testOutput.push('Add New User: FAIL');
      }  
    });
  }

  /**
   * testAdminLogin function - test the ability to login to the frontend and access the application - uses admin credentials to get access to full funtionality of application for further testing
   */
  private testAdminlogin()
  {
    let authCred = window.btoa('admin:password');
    this.webService.login(authCred).subscribe((response: any) =>
    {
      console.log(response);
      sessionStorage.setItem('x-access-token', response.token);
      if (response && response.token)
      {
        this.testOutput.push('Login with Admin Credentials: PASS');
      }
      else
      {
        this.testOutput.push('Login with Admin Credentials: FAIL');
      }
    });
  }

  /**
   * testReportsRetried function - test the ability tp retrieve a page of reports from the backend to the frontend - sends request to backend for the 1 page of reports associated with the admin user ID
   */
  private testReportsRetrived()
  {
    this.webService.getReports(1).subscribe((response: any) =>
    {
      console.log(response);
      if (Array.isArray(response.reports) && response.reports.length == 10)
      {
        this.testOutput.push("Page of Reports Retireved: PASS");
      }
      else
      {
        this.testOutput.push("Page of Reports Retireved: FAIL");
      }
    });
  }

  /**
   * testPagesOfReportsAreDifferent function - test the ability to retrieve different pages of reports from the backend to the frontend - sends request to backend for the first page and second page of reports associated with the admin user ID
   */
  private testPagesOfReportsAreDifferent()
  {
    this.webService.getReports(1).subscribe((response: any) =>
    {
      this.firstReportList = response.reports;
      this.webService.getReports(2).subscribe((response: any) => 
      {
        this.secondReportList = response.reports;
        if(this.firstReportList[0]['_id'] != this.secondReportList[0]['_id'])
        {
          this.testOutput.push('Pages 1 and 2 of Reports are different: PASS');
        }
        else
        {
          this.testOutput.push('Pages 1 and 2 of Reports are different: FAIL');
        }
      });
    });
  }

  /**
   * testRetriveReport - test the ability to rerieve a single report from the backend to the frontend - sends a request to the backend contiaing the id of the report requested
   */
  private testRetieveReport()
  {
    this.webService.getReport('6994f4f78f3c285123005d81').subscribe((response: any) =>
    {
      if(response.url == 'test-url.com')
      {
        this.testOutput.push('Retrieve test-url.com Safety Report by ID: PASS');
      }
      else
      {
        this.testOutput.push('Retrieve test-url.com Safety Report by ID: FAIL');
      }
    });
  }

  /**
   * testSubmitURL function - test the ability to submit a url for analsysis - sends a request to the backend with a url to be submitted and checks if submission was successful by checking if total reprots has increased by 1
   */
  private testSubmitURL()
  {
    let url = {'url' : 'http://url-test.com'};
    this.webService.getReports(1).subscribe((response: any) =>
    {
      let numReports = response.totalReports;
      this.webService.submitURL(url).subscribe((response: any) => 
      {
        this.webService.getReports(1).subscribe((response: any) => 
        {
          if(response.totalReports == numReports + 1)
          {
            this.testOutput.push("Submit new URL: PASS");
          }
          else
          {
            this.testOutput.push("Submit New URL: FAIL");
          }
        });
      });
    });
  }

  /**
   * testDeleteReport function - test the ability to delete a report from user - sends a request to the backend with a url and userID and if a report contians both deletes it, and checks if deletion was successful by checking if total reports has decreased by 1
   */
  private testDeleteReport()
  {
    let deleteReport = 
    {
      'url' : 'http://url-test.com',
      'userID' : this.testAdminID
    }
    this.webService.getReports(1).subscribe((response: any) =>
    {
      let numReports = response.totalReports;
      this.webService.deleteReport(deleteReport).subscribe((response: any) => 
      {
        this.webService.getReports(1).subscribe((response: any) => 
        {
          if(response.totalReports == numReports - 1)
          {
            this.testOutput.push("Delete Report: PASS");
          }
          else
          {
            this.testOutput.push("Delete Report: FAIL");
          }
        });
      });
    });
  }

  /**
   * testDeleteUser function - test the ability to delete a user from the application - sends a request to the backend with the id of the user to be deleted
   */
  private testDeleteUser()
  {
    this.webService.deleteUser(this.testUserID).subscribe((response: any) =>
    {
      if(response == null)
      {
        this.testOutput.push('Delete Test User: PASS');
      }
      else
      {
        this.testOutput.push('Delete Test User: FAIL');
      }
    });
  }

  /**
   * testforgotPAssword function - test the ability to request a reset password link - sends a request to the backend with the email address of the user requesting the link
   */
  private testforgotPassword()
  {
    let email = {'email' : 'esspresso@caffine.com'};
    this.webService.forgotPassword(email).subscribe((response: any) =>
    {
      let token = response.url.split('/');
        this.testToken = token[token.length - 1];
        if (response != null)
        {
          this.testOutput.push('Forgot Password reset link: PASS');
        }
        else
        {
          this.testOutput.push('Forgot Password reset link: FAIL');
        }
    });
  }

  /**
   * testResetPassword function - test the ability to reset/update a users password - sends a request to the back end with the new password and reset token containing user id to update password
   */
  private testResetPassword()
  {
    let password = 
    {
      'token' : this.testToken,
      'password' : 'coffee'
    };
    this.webService.resetPassword(password).subscribe((response: any) =>
    {
      if (response != null)
      {
        {
          this.testOutput.push('Reset Password: PASS');
        }
      }
      else
      {
        this.testOutput.push('Reset Password: FAIL');
      }
    });
  }

  /**
   * testLogout function - test the ability to log a user out of the application
   */
  private testLogout()
  {
    this.webService.logout().subscribe((response: any) =>
    {
      this.testOutput.push('Logout: PASS');
      sessionStorage.removeItem('x-access-token')
    });
  }
}
