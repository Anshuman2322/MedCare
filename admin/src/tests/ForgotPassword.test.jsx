import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import { requestPasswordReset, resetPassword, verifyResetOtp } from '../api/authApi.js';

vi.mock('../api/authApi.js', () => ({
  requestPasswordReset: vi.fn(),
  verifyResetOtp: vi.fn(),
  resetPassword: vi.fn(),
}));

const EMAIL = 'admin@test.local';
const TOKEN = 'a'.repeat(64);
const STRONG_PASSWORD = 'N3wSecret!45';

function LoginStub() {
  const location = useLocation();
  return <p>{location.state?.notice}</p>;
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login" element={<LoginStub />} />
      </Routes>
    </MemoryRouter>
  );
}

const digitBoxes = () => screen.getAllByLabelText(/^Digit \d of 6$/);

async function goToCodeStep() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: EMAIL } });
  fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
  await screen.findByText('Check your email');
}

function pasteCode(code) {
  fireEvent.paste(digitBoxes()[0], { clipboardData: { getData: () => code } });
}

async function goToPasswordStep() {
  await goToCodeStep();
  pasteCode('123456');
  await screen.findByText('Set a new password');
}

function fillPasswords(password, confirm = password) {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: confirm } });
}

const updateButton = () => screen.getByRole('button', { name: 'Update password' });

beforeEach(() => {
  vi.clearAllMocks();
  requestPasswordReset.mockResolvedValue({ data: { expiresInSeconds: 600, resendAfterSeconds: 60 } });
  verifyResetOtp.mockResolvedValue({ data: { resetToken: TOKEN } });
  resetPassword.mockResolvedValue({ data: { success: true } });
});

describe('Forgot password flow', () => {
  it('walks from email to code to new password, then returns to login', async () => {
    renderPage();
    await goToPasswordStep();
    expect(requestPasswordReset).toHaveBeenCalledWith(EMAIL);
    expect(verifyResetOtp).toHaveBeenCalledWith(EMAIL, '123456');

    fillPasswords(STRONG_PASSWORD);
    fireEvent.click(updateButton());

    expect(await screen.findByText(/password has been updated/i)).toBeInTheDocument();
    expect(resetPassword).toHaveBeenCalledWith(TOKEN, STRONG_PASSWORD);
  });

  it('shows the server error when the code cannot be sent', async () => {
    requestPasswordReset.mockRejectedValue({ response: { data: { error: 'Password reset is temporarily unavailable.' } } });
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: EMAIL } });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('submits automatically once all six digits are typed', async () => {
    renderPage();
    await goToCodeStep();

    '123456'.split('').forEach((digit, index) => {
      fireEvent.change(digitBoxes()[index], { target: { value: digit } });
    });

    await waitFor(() => expect(verifyResetOtp).toHaveBeenCalledWith(EMAIL, '123456'));
    expect(verifyResetOtp).toHaveBeenCalledTimes(1);
  });

  it('moves back a box on backspace from an empty box', async () => {
    renderPage();
    await goToCodeStep();

    fireEvent.change(digitBoxes()[0], { target: { value: '7' } });
    expect(digitBoxes()[1]).toHaveFocus();

    fireEvent.keyDown(digitBoxes()[1], { key: 'Backspace' });
    expect(digitBoxes()[0]).toHaveFocus();
    expect(digitBoxes()[0]).toHaveValue('');
  });

  it('clears the boxes and shows an error for a wrong code', async () => {
    verifyResetOtp.mockRejectedValue({ response: { data: { error: 'That code is incorrect or has expired.' } } });
    renderPage();
    await goToCodeStep();
    pasteCode('999999');

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect or has expired/i);
    digitBoxes().forEach((box) => expect(box).toHaveValue(''));
  });

  it('holds back resend until the cooldown ends', async () => {
    renderPage();
    await goToCodeStep();
    expect(screen.getByRole('button', { name: /resend in \d+s/i })).toBeDisabled();
  });

  it('keeps the submit button disabled until the password is strong and confirmed', async () => {
    renderPage();
    await goToPasswordStep();
    expect(updateButton()).toBeDisabled();

    fillPasswords('weakpass');
    expect(updateButton()).toBeDisabled();

    fillPasswords(STRONG_PASSWORD, 'Different!45');
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    expect(updateButton()).toBeDisabled();

    fillPasswords(STRONG_PASSWORD);
    expect(updateButton()).toBeEnabled();
  });

  it('stays on the password step when the password is rejected', async () => {
    resetPassword.mockRejectedValue({ response: { data: { error: 'New password must be different from your current password.' } } });
    renderPage();
    await goToPasswordStep();
    fillPasswords(STRONG_PASSWORD);
    fireEvent.click(updateButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/must be different/i);
    expect(screen.getByText('Set a new password')).toBeInTheDocument();
  });

  it('restarts from the email step when the reset session has expired', async () => {
    resetPassword.mockRejectedValue({
      response: { data: { error: 'Your reset session has expired.', code: 'RESET_SESSION_EXPIRED' } },
    });
    renderPage();
    await goToPasswordStep();
    fillPasswords(STRONG_PASSWORD);
    fireEvent.click(updateButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/i);
    expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument();
  });
});
