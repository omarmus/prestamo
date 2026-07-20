import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SimulatorForm } from '../simulator-form';

afterEach(cleanup);

describe('SimulatorForm', () => {
  it('renders with default values', () => {
    render(<SimulatorForm onSimulate={async () => {}} isLoading={false} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(10000);
    expect(inputs[1]).toHaveValue(12);
    expect(inputs[2]).toHaveValue(12);
  });

  it('calls onSimulate with correct values on click', async () => {
    const onSimulate = vi.fn().mockResolvedValue(undefined);
    render(<SimulatorForm onSimulate={onSimulate} isLoading={false} />);
    fireEvent.click(screen.getByText('Simular'));
    expect(onSimulate).toHaveBeenCalledWith({ amount: 10000, termMonths: 12, annualRate: 12 });
  });

  it('shows spinner and disables button when loading', () => {
    render(<SimulatorForm onSimulate={async () => {}} isLoading={true} />);
    expect(screen.getByText('Simular')).toBeDisabled();
  });

  it('syncs with initialValues prop', () => {
    render(
      <SimulatorForm
        onSimulate={async () => {}}
        isLoading={false}
        initialValues={{ amount: '50000', termMonths: '24', annualRate: '8.5' }}
      />,
    );
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(50000);
    expect(inputs[1]).toHaveValue(24);
    expect(inputs[2]).toHaveValue(8.5);
  });
});
