import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressionMapPage } from './progression-map.page';

describe('ProgressionMapPage', () => {
  let component: ProgressionMapPage;
  let fixture: ComponentFixture<ProgressionMapPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressionMapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
