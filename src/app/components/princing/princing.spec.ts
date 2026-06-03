import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Princing } from './princing';

describe('Princing', () => {
  let component: Princing;
  let fixture: ComponentFixture<Princing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Princing],
    }).compileComponents();

    fixture = TestBed.createComponent(Princing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
