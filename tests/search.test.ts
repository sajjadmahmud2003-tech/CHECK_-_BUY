import { describe, it, expect } from 'vitest';
import { dataStore } from '../src/lib/data-store';

describe('Land Record Search & Filtering', () => {
  it('retrieves all records when no filter is applied', () => {
    const all = dataStore.getRecords();
    expect(all.length).toBeGreaterThanOrEqual(5);
  });

  it('filters records by district correctly', () => {
    const dhakaRecords = dataStore.getRecords({ district: 'Dhaka' });
    expect(dhakaRecords.length).toBeGreaterThan(0);
    expect(dhakaRecords.every(r => r.district === 'Dhaka')).toBe(true);

    const chattogramRecords = dataStore.getRecords({ district: 'Chattogram' });
    expect(chattogramRecords.length).toBe(1);
    expect(chattogramRecords[0].district).toBe('Chattogram');
  });

  it('filters records by dag number', () => {
    const results = dataStore.getRecords({ dagNo: '405' });
    expect(results.length).toBe(1);
    expect(results[0].dagNo).toBe('405');
  });

  it('filters records by issues status', () => {
    const cleanOnly = dataStore.getRecords({ statusFilter: 'clean' });
    expect(cleanOnly.every(r => !r.hasCaveatOrDispute && r.mutation?.status === 'approved')).toBe(true);

    const issuesOnly = dataStore.getRecords({ statusFilter: 'has_issues' });
    expect(issuesOnly.every(r => r.hasCaveatOrDispute || r.mutation?.status !== 'approved')).toBe(true);
  });
});
