import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GroupSessionRSVPCard from '../GroupSessionRSVPCard';
import { GroupSession, GroupSessionRsvp } from '../../../types';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const baseSession: GroupSession = {
  id: 'session-1',
  group_chat_id: 'group-1',
  proposed_by: 'user-other',
  scheduled_date: '2026-03-16',
  status: 'proposed',
  created_at: '2026-03-15T00:00:00Z',
  updated_at: '2026-03-15T00:00:00Z',
};

function makeRsvp(userId: string, response: 'yes' | 'no'): GroupSessionRsvp {
  return {
    id: userId,
    group_session_id: 'session-1',
    user_id: userId,
    response,
    created_at: '',
    updated_at: '',
  };
}

const defaultProps = {
  session: baseSession,
  rsvps: [],
  memberCount: 4,
  currentUserId: 'user-me',
  proposedByName: 'Alex',
  onRsvp: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Smoke test ───────────────────────────────────────────────────────────────

it('renders without crashing (proposed, no rsvps)', () => {
  render(<GroupSessionRSVPCard {...defaultProps} />);
});

it('returns null for cancelled session', () => {
  const { toJSON } = render(
    <GroupSessionRSVPCard
      {...defaultProps}
      session={{ ...baseSession, status: 'cancelled' }}
    />
  );
  expect(toJSON()).toBeNull();
});

// ── formatDateLabel (tested via rendered meta line) ──────────────────────────

describe('meta line date format', () => {
  // '2026-03-16' is a Monday
  it('uses short weekday — shows "Mon,"', () => {
    const { getByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(getByText(/Mon,/)).toBeTruthy();
  });

  it('does NOT show full weekday "Monday,"', () => {
    const { queryByText } = render(<GroupSessionRSVPCard {...defaultProps} />);
    expect(queryByText(/Monday,/)).toBeNull();
  });
});
