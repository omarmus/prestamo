import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SimulationHistory } from '../simulation-history';

afterEach(cleanup);

function makeSim(id: string) {
  return {
    id,
    amount: 10000,
    termMonths: 12,
    annualRate: 12,
    monthlyPayment: 888.49,
    totalInterest: 661.85,
    totalPayment: 10661.85,
    schedule: [],
    createdAt: '2026-06-10T10:00:00Z',
  };
}

describe('SimulationHistory', () => {
  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(
      <SimulationHistory simulations={[]} isLoading={true} onSelect={() => {}} />,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(2);
  });

  it('returns null when simulations array is empty', () => {
    const { container } = render(
      <SimulationHistory simulations={[]} isLoading={false} onSelect={() => {}} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows header with count when simulations exist', () => {
    render(
      <SimulationHistory simulations={[makeSim('1')]} isLoading={false} onSelect={() => {}} />,
    );
    expect(screen.getByText('Simulaciones Anteriores')).toBeInTheDocument();
  });

  it('expands list when header is clicked', () => {
    render(
      <SimulationHistory simulations={[makeSim('1')]} isLoading={false} onSelect={() => {}} />,
    );
    // List starts collapsed
    expect(screen.queryByText(/Bs\./)).not.toBeInTheDocument();
    // There are two matching elements (CardHeader + CardTitle), click either works via bubbling
    const headers = screen.getAllByText('Simulaciones Anteriores');
    fireEvent.click(headers[0]);
    // Now expanded (flexible match: locale may produce 10,000 or 10.000)
    expect(screen.getByText(/Bs\.\s*10[.,]?000/)).toBeInTheDocument();
  });

  it('calls onSelect when a simulation is clicked', () => {
    const onSelect = vi.fn();
    render(
      <SimulationHistory
        simulations={[makeSim('sim-1')]}
        isLoading={false}
        onSelect={onSelect}
      />,
    );
    const headers = screen.getAllByText('Simulaciones Anteriores');
    fireEvent.click(headers[0]);
    fireEvent.click(screen.getByText(/Bs\.\s*10[.,]?000/));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'sim-1' }));
  });
});
