import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserForm } from '../create-user-form';

afterEach(cleanup);

const mockProfile = {
  id: '1',
  email: 'admin@example.com',
  name: 'Test Admin',
  phone: '+59177123456',
  role: 'ADMIN' as const,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('CreateUserForm', () => {
  it('renders form fields', () => {
    render(<CreateUserForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear usuario/i })).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    render(<CreateUserForm onSubmit={vi.fn()} />);

    const form = screen.getByRole('button', { name: /crear usuario/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit with valid form data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(mockProfile);
    const user = userEvent.setup();
    render(<CreateUserForm onSubmit={onSubmit} onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText('Nombre'), 'Test Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Teléfono'), '+59177123456');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Admin',
        email: 'admin@test.com',
        phone: '+59177123456',
        password: 'password123',
      });
    });
  });

  it('calls onSuccess when submit succeeds', async () => {
    const onSubmit = vi.fn().mockResolvedValue(mockProfile);
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<CreateUserForm onSubmit={onSubmit} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText('Nombre'), 'Test Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Teléfono'), '+59177123456');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear usuario/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const onSubmit = vi.fn().mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    render(<CreateUserForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre'), 'Test Admin');
    await user.type(screen.getByLabelText('Email'), 'admin@test.com');
    await user.type(screen.getByLabelText('Teléfono'), '+59177123456');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: /crear usuario/i }));

    expect(screen.getByRole('button', { name: /creando/i })).toBeInTheDocument();
  });
});
