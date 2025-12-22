import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryDetailPage } from './story-detail.page';

describe('StoryDetailPage', () => {
  let component: StoryDetailPage;
  let fixture: ComponentFixture<StoryDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
