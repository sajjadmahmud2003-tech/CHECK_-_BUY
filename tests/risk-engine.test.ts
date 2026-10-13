import { describe, it, expect } from 'vitest';
import { analyzeLandRecordRisks } from '../src/lib/risk-engine';
import { MOCK_LAND_RECORDS } from '../src/lib/mock-data';

describe('Deterministic Rule-Based Risk Engine', () => {
  it('correctly scores clean property (Dhanmondi Dag 405) with Low Concern', () => {
    const cleanRecord = MOCK_LAND_RECORDS.find(r => r.id === 'rec-dhanmondi-101');
    expect(cleanRecord).toBeDefined();

    const result = analyzeLandRecordRisks(cleanRecord!);
    expect(result.overallLevel).toBe('low');
    expect(result.overallScore).toBeLessThanOrEqual(30);
    expect(result.findings.length).toBe(0);
  });

  it('detects area variance discrepancy between surveys (Gulshan Dag 1204)', () => {
    const gulshanRecord = MOCK_LAND_RECORDS.find(r => r.id === 'rec-gulshan-202');
    expect(gulshanRecord).toBeDefined();

    const result = analyzeLandRecordRisks(gulshanRecord!);
    expect(result.findings.some(f => f.category === 'area')).toBe(true);
    expect(result.findings.some(f => f.ruleCode === 'RULE-AREA-02')).toBe(true);
    expect(result.overallLevel).toMatch(/medium|high/);
  });

  it('flags high priority review for conflicting ownership and rejected mutation (Uttara Dag 870)', () => {
    const uttaraRecord = MOCK_LAND_RECORDS.find(r => r.id === 'rec-uttara-303');
    expect(uttaraRecord).toBeDefined();

    const result = analyzeLandRecordRisks(uttaraRecord!);
    expect(result.overallLevel).toBe('high');
    expect(result.overallScore).toBeGreaterThanOrEqual(65);
    expect(result.findings.some(f => f.category === 'ownership')).toBe(true);
    expect(result.findings.some(f => f.ruleCode === 'RULE-MUT-05')).toBe(true);
  });

  it('detects broken chain of title when survey records are missing (Chattogram Dag 310)', () => {
    const chattogramRecord = MOCK_LAND_RECORDS.find(r => r.id === 'rec-chattogram-404');
    expect(chattogramRecord).toBeDefined();

    const result = analyzeLandRecordRisks(chattogramRecord!);
    expect(result.findings.some(f => f.ruleCode === 'RULE-CHAIN-03')).toBe(true);
  });
});
