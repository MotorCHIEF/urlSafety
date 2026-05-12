import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Createuser } from './createuser';

describe('Createuser', () => {
  let component: Createuser;
  let fixture: ComponentFixture<Createuser>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => 'mock-id'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Createuser],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ActivatedRoute, useValue: activatedRouteMock }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Createuser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isMatching() Password Validation', () => {
    
    it('should return TRUE when both passwords match exactly', () => {
      // Setup: Exact match
      const result = component.isMatching('Password', 'Password');
      expect(result).toBeTrue();
    });

    it('should return FALSE when passwords are different', () => {
      // Setup: Completely different strings
      const result = component.isMatching('password123', 'Password456');
      expect(result).toBeFalse();
    });
  });
});
