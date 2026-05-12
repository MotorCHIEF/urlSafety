import { Injectable } from '@angular/core';

/**
 * Global service for toast messages
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService 
{

  /**
   * Array to store currently active toast message - acts as a queue
   */
  toasts: any = [];
  
  /**
   * The duration for which the message is displayed default = 5 seconds
   */
  duration: number = 5000;

  /**
   * Adds a new toast message to tost queue
   * @param message the text/content of the message to be displayed
   */
  add(message: any)
  {
    this.toasts.push(message);
    setTimeout(() => this.remove(0), this.duration);
  }

  /**
   * Removes toast message from toast array
   * Called by add function
   * @param index The array index of the toast to remove
   */
  remove(index: number)
  {
    this.toasts.splice(index, 1);
  }

  /**
   * success Message function reutrns the appropriate bootsrap class for the toast message based on the content of the message
   * @param message the text/content of the message of the toast message
   * @returns bg-success if the message contains 'success' or 'Success', bg-danger otherwise
   */
  successMessage(message: any)
  {
    if (message.includes('success') || message.includes('Success'))
    {
      return 'bg-success';
    }
    else
    {
      return 'bg-danger';
    }
  }
}
