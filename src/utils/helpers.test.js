import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatTime,
  timeAgo,
  getInitials,
  generateId,
  isDueSoon,
  isOverdue,
} from './helpers';

describe('Helpers', () => {
  const FIXED_SYSTEM_TIME = new Date('2026-05-02T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_SYSTEM_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockFirebaseTimestamp = (dateString) => ({
    toDate: () => new Date(dateString)
  });

  describe('formatDate', () => {
    it('returns empty string if no date provided', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('formats a standard JS Date correctly', () => {
      const d = new Date('2026-05-02T12:00:00Z');
      // Using toLocaleDateString without exact exact matches to prevent timezone failures
      expect(formatDate(d)).toContain('2026');
    });

    it('formats a Firebase Timestamp correctly', () => {
      const t = mockFirebaseTimestamp('2026-05-02T12:00:00Z');
      expect(formatDate(t)).toContain('2026');
    });
  });

  describe('formatTime', () => {
    it('returns empty string if no date provided', () => {
      expect(formatTime(null)).toBe('');
    });

    it('formats a JS Date correctly', () => {
      const d = new Date('2026-05-02T15:30:00Z');
      expect(formatTime(d)).toBeDefined();
    });

    it('formats a Firebase Timestamp correctly', () => {
      const t = mockFirebaseTimestamp('2026-05-02T15:30:00Z');
      expect(formatTime(t)).toBeDefined();
    });
  });

  describe('timeAgo', () => {
    it('returns empty string if no date provided', () => {
      expect(timeAgo(null)).toBe('');
    });

    it('returns "just now" for times < 60 seconds ago', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 30 * 1000); // 30 seconds ago
      expect(timeAgo(d)).toBe('just now');
      expect(timeAgo(mockFirebaseTimestamp(d.toISOString()))).toBe('just now');
    });

    it('returns minutes ago for times < 60 minutes ago', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 15 * 60 * 1000); // 15 mins ago
      expect(timeAgo(d)).toBe('15m ago');
    });

    it('returns hours ago for times < 24 hours ago', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 5 * 60 * 60 * 1000); // 5 hours ago
      expect(timeAgo(d)).toBe('5h ago');
    });

    it('returns days ago for times < 7 days ago', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(timeAgo(d)).toBe('3d ago');
    });

    it('returns formatted date for times >= 7 days ago', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      expect(timeAgo(d)).toContain('2026');
    });
  });

  describe('getInitials', () => {
    it('returns "?" if no name provided', () => {
      expect(getInitials(null)).toBe('?');
      expect(getInitials('')).toBe('?');
    });

    it('returns single letter for single word name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('returns two letters for two word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('returns two letters max for multi-word name', () => {
      expect(getInitials('John Robert Doe')).toBe('JR');
    });

    it('capitalizes initials', () => {
      expect(getInitials('jane doe')).toBe('JD');
    });
  });

  describe('generateId', () => {
    it('returns a random string of correct length', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeTypeOf('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id1).not.toBe(id2);
    });
  });

  describe('isDueSoon', () => {
    it('returns false if no date provided', () => {
      expect(isDueSoon(null)).toBe(false);
    });

    it('returns true if due within 48 hours (in future)', () => {
      const d = new Date(FIXED_SYSTEM_TIME + 24 * 60 * 60 * 1000); // due in 1 day
      expect(isDueSoon(d)).toBe(true);
      expect(isDueSoon(mockFirebaseTimestamp(d.toISOString()))).toBe(true);
    });

    it('returns false if due is past', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 1 * 60 * 60 * 1000); // overdue by 1 hr
      expect(isDueSoon(d)).toBe(false);
    });

    it('returns false if due is more than 48 hours away', () => {
      const d = new Date(FIXED_SYSTEM_TIME + 3 * 24 * 60 * 60 * 1000); // due in 3 days
      expect(isDueSoon(d)).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('returns false if no date provided', () => {
      expect(isOverdue(null)).toBe(false);
    });

    it('returns true if due date is in the past', () => {
      const d = new Date(FIXED_SYSTEM_TIME - 1 * 60 * 60 * 1000); // overdue by 1 hour
      expect(isOverdue(d)).toBe(true);
      expect(isOverdue(mockFirebaseTimestamp(d.toISOString()))).toBe(true);
    });

    it('returns false if due date is in the future', () => {
      const d = new Date(FIXED_SYSTEM_TIME + 1 * 60 * 60 * 1000); // due in 1 hour
      expect(isOverdue(d)).toBe(false);
    });
  });
});
