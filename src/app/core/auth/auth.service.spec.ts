import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  function setup(authApi: Partial<AuthApi>) {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthApi,
          useValue: authApi,
        },
      ],
    });

    return TestBed.inject(AuthService);
  }

  it('keeps the access token in memory after login', async () => {
    const service = setup({
      login: () => of({ accessToken: 'access-token', expiresIn: 900 }),
    });

    await service.login({ email: 'me@example.com', password: 'test-password' });

    expect(service.accessToken()).toBe('access-token');
    expect(service.session().status).toBe('authenticated');
  });

  it('clears the session when refresh fails', async () => {
    const service = setup({
      refresh: () => throwError(() => new Error('expired')),
    });

    const restored = await service.refresh();

    expect(restored).toBe(false);
    expect(service.accessToken()).toBeNull();
    expect(service.session().status).toBe('anonymous');
  });

  it('clears the session after logout even when the API call fails', async () => {
    const service = setup({
      login: () => of({ accessToken: 'access-token', expiresIn: 900 }),
      logout: () => throwError(() => new Error('network')),
    });

    await service.login({ email: 'me@example.com', password: 'test-password' });
    await service.logout();

    expect(service.accessToken()).toBeNull();
    expect(service.session().status).toBe('anonymous');
  });
});
