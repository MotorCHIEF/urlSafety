import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Service that handles all calls to the backend api.
 */
@Injectable({
  providedIn: 'root',
})
export class WebService 
{
 
  /**
   * Number of reports to be shown per page when paginating through the reports list.
   */
  pageSize: number = 10;
  
  /**
   * Constructor for the web service
   * @param http, the http client is used to make calls to the backend api
   */
  constructor(private http: HttpClient)
  {

  }

  /**
   * Login function - sends login details (username and password) to the backend and returns an x-accesstoken in response if details are correct
   * @param auth, base 64 encoded string of the username and passowrd
   * @returns, success - x-access-token permitting access to application, failure - error message
   */
  login(auth : any)
  {
    return this.http.get<any>('http://localhost:5000/api/v1.0/login', {headers: {'Authorization' : 'Basic ' + auth}});
  }
  
  /**
   * Logout function - sends request to backend that blacklists the x-access-token
   * @returns success - message confirming logout and blcklisted x-access-token
   */
  logout()
  {
    return this.http.get<any>('http://localhost:5000/api/v1.0/logout', {headers: {'x-access-token' : sessionStorage['x-access-token']}});
  }

  /**
   * createUser function - sends new user details to backend to create a new user in the application
   * @param user, details of the new user, e.g. name, username, password, email 
   * @returns, success - message confirming user creation, failure - error message
   */
  createUser(user: any)
  {
    let userData = new FormData();
    userData.append('name', user.name);
    userData.append('username', user.username);
    userData.append('password', user.password);
    userData.append('email', user.email);
    return this.http.post<any>('http://localhost:5000/api/v1.0/users', userData);
  }

  /**
   * deleteUser function - sends a request to the backend to delete a user from the application
   * @param id, the id of the user to be deleted
   * @returns, success - message confirming deleetion of user, failure - error message
   */
  deleteUser(id: any)
  {
    return this.http.delete<any>('http://localhost:5000/api/v1.0/users/' + id, {headers: {'x-access-token' : sessionStorage['x-access-token']}});
  }

  /**
   * submitURL function - sends a requst to the backeend to submit a url for analysis and report generation
   * @param url, url to be submitted for analysis
   * @returns, success - message confirming submission of url and report generation, url link of report, failure - error message
   */
  submitURL(url: any)
  {
    let urlData = new FormData();
    urlData.append('url', url.url)
    return this.http.post<any>('http://localhost:5000/api/v3/reports', urlData, {headers: {'x-access-token' : sessionStorage['x-access-token']}});
  }

  /**
   * getReports function - sends a request to the backend to retrieve a list of all reports in the application, paginated by 10 reports per page
   * @param page, the page number of the reports to be retrieved
   * @returns success - list of reports, failure - error message
   */
  getReports(page: number)
  {
    return this.http.get<any>('http://localhost:5000/api/v3/reports?pn=' + page + '&ps=' + this.pageSize, {headers: {'x-access-token' : sessionStorage['x-access-token']}});
  }

  /**
   * getReport function - sends a request to the backend to retrieve a specific report based on the report id
   * @param id, id of report being retireved
   * @returns, success - report details, failure - error message
   */
  getReport(id: any)
  {
    return this.http.get<any>('http://localhost:5000/api/v1/reports/' + id, {headers: {'x-access-token' : sessionStorage['x-access-token']}});
  }

  /**
   * deleteReport function - sends a request to the backend to delete a specific report based on the url and user id of the report
   * @param url, url and user id of the report to be deleted
   * @returns, success - message confirming deletion of report, failure - error message
   */
  deleteReport(url: any)
  {
    let urlData = new FormData();
    urlData.append('url', url.url);
    urlData.append('userID', url.userID);
    return this.http.delete<any>('http://localhost:5000/api/v2/reports', {headers: {'x-access-token' : sessionStorage['x-access-token']}, body: urlData}); 
  }

  /**
   * forgotPassword function - sends a request to the backend to create and send an email to the provided email containing and reset password link
   * @param email, email address to recieve the reset password link
   * @returns success - url of reset link, failure - error message
   */
  forgotPassword(email: any)
  {
    let emailData = new FormData();
    emailData.append('email', email.email);
    return this.http.post<any>('http://localhost:5000/api/v1.0/forgotpassword', emailData);
  }

  /**
   * resetPassword function - sends a request to the backend to update the password of the user id contained in the token
   * @param password, token of the reset link to allow reset of password, password new password to be set
   * @returns, success - password is updated and success message is given, failure - error message
   */
  resetPassword(password: any)
  {
    let token = password.token;
    let passwordData = new FormData();
    passwordData.append('password', password.password)
    return this.http.put<any>('http://localhost:5000/api/v1.0/resetpassword/' + token, passwordData);
  }
}
