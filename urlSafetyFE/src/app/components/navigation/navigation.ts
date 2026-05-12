import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebService } from '../../services/web-service';

/**
 * Navigation Component for Application
 */
@Component({
  selector: 'app-navigation',
  imports: [RouterModule, CommonModule],
  providers: [WebService],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation 
{

  /**
   * Constructor for navigation.ts file
   * @param webService, used to perform GET requests to backend
   * @param router, used to navigate user to naviagate user to login page on logout
   */
  constructor(private webService: WebService, private router: Router)
  {

  }

  /**
   * Logout function logs user out
   * calls backened logout function that add access token to blacklist
   * Remove sessionStorage x-access-token
   */
  logout()
  {
    this.webService.logout().subscribe((response: any) =>{
      sessionStorage.removeItem('x-access-token');
      this.router.navigate(['']);
    });
  }

  /**
   * Logged In function checks if a user is logged in by checking if x-access-token is in sessionStorage
   * @returns 'true' and shows navigate link in navigation if user is logged in, 'false' and hides navigate links if user is not logged in
   */
  isloggedIn()
  {
    if (sessionStorage.getItem('x-access-token') == null)
    {
      return false;
    }
    else
    {
      return true;
    }
  }

  /**
   * Is Admin function checks if logged in user has admin level access
   * @returns 'true' shows navigation link to admin page if user is an admin, 'false' and hides navigation link to admin page if user is not an admin
   */
  isAdmin()
  { //Gets x-access token from session storage
    let token = sessionStorage.getItem('x-access-token');
    if(!token) 
    {
      return false;
    }

    try
    { //Decodes token and check if admin field is true in token data
      let admin = token.split(".")[1];
      let data = JSON.parse(window.atob(admin));
      if(data.admin === true)
      {
        return true;
      }
    }
    catch (e)
    {
      return false;
    }
    return false;
  }

  /**
   * Reset Page Storage function resets page number in session storage to 1..
   */
  resetPageStorage()
  {
    sessionStorage['page'] = 1;
  }
}
