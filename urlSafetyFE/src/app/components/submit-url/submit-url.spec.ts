import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { SubmitURL } from './submit-url';

describe('SubmitURL', () => {
  let component: SubmitURL;
  let fixture: ComponentFixture<SubmitURL>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => 'mock-id'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitURL],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ActivatedRoute, useValue: activatedRouteMock }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmitURL);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isInvalid() Form Validation', () =>{
    it('should return TRUE when the URL control is invalid and touched', () => {
      const control = component.submitForm.controls['url'];
      
      control.setValue(''); // Empty makes it invalid (Validators.required)
      control.markAsTouched(); // Simulates user clicking into and out of the field

      expect(component.isInvalid('url')).toBeTrue();
    });

    it('should return FALSE when the URL control is valid and untouched', () => {
      const control = component.submitForm.controls['url'];
      
      control.setValue('http://google.com'); // Valid URL
      control.markAsUntouched(); 

      expect(component.isInvalid('url')).toBeFalse();
    });
  });

  describe('isUntouched() Form State', () => {
    
    it('should return TRUE when the URL control is pristine (user has not typed)', () => {
      const control = component.submitForm.controls['url'];
      
      control.markAsPristine(); // Simulates an untouched input
      
      expect(component.isUntouched()).toBeTrue();
    });

    it('should return FALSE when the URL control is dirty (user has typed)', () => {
      const control = component.submitForm.controls['url'];
      
      control.markAsDirty(); // Simulates a user typing a value
      
      expect(component.isUntouched()).toBeFalse();
    });
  });

  describe('isIncomplete() Composite Check', () => {
    
    it('should return TRUE if the form is untouched, even if technically valid', () => {
      const control = component.submitForm.controls['url'];
      
      // Setup: Valid value, but the user hasn't actually interacted with it (pristine)
      control.setValue('http://google.com');
      control.markAsPristine();
      control.markAsUntouched();

      expect(component.isIncomplete()).toBeTrue();
    });

    it('should return TRUE if the form has been typed in, but is invalid', () => {
      const control = component.submitForm.controls['url'];
      
      // Setup: User typed something (dirty/touched), but it's empty/invalid
      control.setValue('');
      control.markAsDirty();
      control.markAsTouched();

      expect(component.isIncomplete()).toBeTrue();
    });

    it('should return FALSE only when the URL is both valid AND the user has typed it in', () => {
      const control = component.submitForm.controls['url'];
      
      // Setup: The "Perfect" State. Valid URL, and the user actively typed it.
      control.setValue('http://google.com');
      control.markAsDirty();
      control.markAsTouched();

      expect(component.isIncomplete()).toBeFalse(); // This means the form is COMPLETE!
    });
  });
});
