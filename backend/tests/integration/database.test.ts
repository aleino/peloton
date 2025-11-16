import { describe, it, expect, afterAll } from 'vitest';
import { query, closeDatabasePool } from '../../src/config/database.js';

describe('Database Automatic Camelization', () => {
  afterAll(async () => {
    await closeDatabasePool();
  });

  it('should automatically convert snake_case to camelCase with query()', async () => {
    // Use query() directly - automatic camelCase conversion!
    const result = await query<{
      currentTimestamp: Date;
      testValue: number;
      snakeCaseColumn: string;
    }>(
      `SELECT 
        NOW() as current_timestamp,
        42 as test_value,
        'hello' as snake_case_column
      `
    );

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];

    // Should have camelCase keys automatically
    expect(row).toHaveProperty('currentTimestamp');
    expect(row).toHaveProperty('testValue');
    expect(row).toHaveProperty('snakeCaseColumn');

    // Should NOT have snake_case keys
    expect(row).not.toHaveProperty('current_timestamp');
    expect(row).not.toHaveProperty('test_value');
    expect(row).not.toHaveProperty('snake_case_column');

    // Values should be correct
    expect(row.testValue).toBe(42);
    expect(row.snakeCaseColumn).toBe('hello');
    expect(row.currentTimestamp).toBeInstanceOf(Date);
  });

  it('should work with parameterized queries', async () => {
    const result = await query<{
      inputValue: string;
      upperCaseValue: string;
    }>(
      'SELECT $1::text as input_value, UPPER($1::text) as upper_case_value',
      ['test']
    );

    expect(result.rows[0].inputValue).toBe('test');
    expect(result.rows[0].upperCaseValue).toBe('TEST');
  });

  it('should handle columns without underscores', async () => {
    const result = await query<{
      name: string;
      count: number;
    }>('SELECT \'John\' as name, 123 as count');

    expect(result.rows[0].name).toBe('John');
    expect(result.rows[0].count).toBe(123);
  });

  it('should handle multiple underscores', async () => {
    const result = await query<{
      veryLongColumnName: string;
    }>('SELECT \'value\' as very_long_column_name');

    expect(result.rows[0].veryLongColumnName).toBe('value');
  });

  it('should work with actual database tables', async () => {
    // This assumes stations table exists from ETL pipeline
    const result = await query<{
      stationId: string;
      name: string;
      createdAt: Date;
    }>(
      'SELECT station_id, name, created_at FROM hsl.stations LIMIT 1'
    );

    if (result.rows.length > 0) {
      const station = result.rows[0];
      expect(station).toHaveProperty('stationId');
      expect(station).toHaveProperty('name');
      expect(station).toHaveProperty('createdAt');
      expect(typeof station.stationId).toBe('string');
      expect(typeof station.name).toBe('string');
      expect(station.createdAt).toBeInstanceOf(Date);
    }
  });
});
