import { groupTasksByStatus, toApiDateTime, toDateInputValue } from './api.types';

describe('API type helpers', () => {
  it('groups tasks into all supported statuses', () => {
    const grouped = groupTasksByStatus([
      { id: '1', title: 'Plan', status: 'TODO' },
      { id: '2', title: 'Build', status: 'IN_PROGRESS' },
      { id: '3', title: 'Ship', status: 'DONE' },
    ]);

    expect(grouped.TODO.map((task) => task.title)).toEqual(['Plan']);
    expect(grouped.IN_PROGRESS.map((task) => task.title)).toEqual(['Build']);
    expect(grouped.DONE.map((task) => task.title)).toEqual(['Ship']);
  });

  it('maps date input values to backend date-time strings', () => {
    expect(toApiDateTime('2026-07-28')).toBe('2026-07-28T00:00:00');
    expect(toApiDateTime('')).toBeNull();
    expect(toApiDateTime(null)).toBeNull();
  });

  it('maps backend date-time strings to date input values', () => {
    expect(toDateInputValue('2026-07-28T11:30:00')).toBe('2026-07-28');
    expect(toDateInputValue(null)).toBe('');
  });
});
