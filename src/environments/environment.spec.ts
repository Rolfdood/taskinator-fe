import { environment } from './environment';

describe('environment', () => {
  it('uses a same-origin API base for deployed browser requests', () => {
    expect(environment.apiBaseUrl).toBe('/api/v1');
  });
});
