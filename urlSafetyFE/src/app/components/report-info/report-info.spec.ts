import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ReportInfo } from './report-info';

describe('ReportInfo', () => {
  let component: ReportInfo;
  let fixture: ComponentFixture<ReportInfo>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => 'mock-id'
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportInfo],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ActivatedRoute, useValue: activatedRouteMock }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
