import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatWidget from '../components/chat/ChatWidget.jsx';
import { pollChatMessages } from '../api/chat';

vi.mock('../api/chat', () => ({
  pollChatMessages: vi.fn(),
  startChatSession: vi.fn(() => new Promise(() => {})),
  sendChatMessage: vi.fn(),
  requestChatHandoff: vi.fn(),
  recordChatInquiry: vi.fn(),
  checkInquiryStatus: vi.fn(),
}));

const reply = {
  id: 'm-agent-1',
  role: 'agent',
  agentName: 'Henry',
  text: 'Hi Jane, Henry here. I can help with your 50 boxes.',
  at: new Date(Date.now() + 1000).toISOString(),
};

beforeEach(() => {
  sessionStorage.clear();
  pollChatMessages.mockReset();
  document.title = 'CureNeed';
});

const renderWidget = () =>
  render(
    <MemoryRouter>
      <ChatWidget />
    </MemoryRouter>
  );

describe('chat launcher while waiting for the team', () => {
  it("shows the team's reply on the launcher when the chat is closed", async () => {
    sessionStorage.setItem('cureneed-chat-session', 'a'.repeat(48));
    sessionStorage.setItem('cureneed-chat-live', '1');
    sessionStorage.setItem('cureneed-chat-seen', new Date().toISOString());
    pollChatMessages.mockResolvedValue({ conversation: { handoffRequested: true }, messages: [reply] });

    renderWidget();

    expect(await screen.findByText(reply.text)).toBeInTheDocument();
    expect(screen.getByText('Henry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open CureNeed Support \(1 new message from our team\)/ })).toBeInTheDocument();
    expect(document.title).toBe('(1) CureNeed');
    expect(pollChatMessages).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: 'a'.repeat(48) }));

    // Dismissing hides the preview but keeps the unread badge on the launcher.
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message preview' }));
    expect(screen.queryByText(reply.text)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1 new message/ })).toBeInTheDocument();
  });

  it('opens the chat from the preview and clears the unread count', async () => {
    sessionStorage.setItem('cureneed-chat-session', 'b'.repeat(48));
    sessionStorage.setItem('cureneed-chat-live', '1');
    sessionStorage.setItem('cureneed-chat-seen', new Date().toISOString());
    pollChatMessages.mockResolvedValue({ conversation: { handoffRequested: true }, messages: [reply] });

    renderWidget();
    fireEvent.click(await screen.findByRole('button', { name: 'Reply' }));

    await waitFor(() => expect(document.title).toBe('CureNeed'));
    expect(screen.queryByRole('button', { name: /new message/ })).not.toBeInTheDocument();
  });

  it('does not check for replies when the visitor never asked for the team', async () => {
    sessionStorage.setItem('cureneed-chat-session', 'c'.repeat(48));
    renderWidget();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(pollChatMessages).not.toHaveBeenCalled();
  });
});
