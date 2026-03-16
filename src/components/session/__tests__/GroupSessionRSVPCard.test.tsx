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

// ── count line ───────────────────────────────────────────────────────────────

describe('count line', () => {
  it('two-segment when no one has declined', () => {
    const { getByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        rsvps={[makeRsvp('user-a', 'yes')]}
        memberCount={4}
      />
    );
    expect(getByText("1 going · 3 haven't replied")).toBeTruthy();
  });

  it('three-segment when at least one person declined', () => {
    const { getByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        rsvps={[makeRsvp('user-a', 'yes'), makeRsvp('user-b', 'no')]}
        memberCount={4}
      />
    );
    expect(getByText('1 going · 1 not going · 2 pending')).toBeTruthy();
  });

  it('count line is absent in completed state', () => {
    const { queryByText } = render(
      <GroupSessionRSVPCard
        {...defaultProps}
        session={{ ...baseSession, status: 'completed' }}
      />
    );
    // Neither format should appear
    expect(queryByText(/going ·/)).toBeNull();
  });
});
