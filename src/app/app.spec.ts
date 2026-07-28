import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the routed application outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.debugElement.query(By.directive(RouterOutlet))).toBeTruthy();
  });

  it('defines public and authenticated taskinator routes', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('login');
    expect(paths).toContain('register');
    expect(paths).toContain('app');
  });
});
