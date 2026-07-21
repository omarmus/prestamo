'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Progress } from '@/components/atoms/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';

interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface SimulationResult {
  id?: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationRow[];
  createdAt?: string;
}

export interface AmortizationTableProps {
  result: SimulationResult;
}

export function AmortizationTable({ result }: AmortizationTableProps) {
  const router = useRouter();
  const [schedulePage, setSchedulePage] = useState(1);
  const rowsPerPage = 12;

  const totalPages = Math.ceil(result.schedule.length / rowsPerPage);
  const paginatedSchedule = result.schedule.slice(
    (schedulePage - 1) * rowsPerPage,
    schedulePage * rowsPerPage,
  );

  return (
    <>
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cuota Mensual</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Bs. {result.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total a Pagar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Bs. {result.totalPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Intereses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">Bs. {result.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plazo</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{result.termMonths} meses</p></CardContent>
        </Card>
      </div>

      {/* Amortization table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla de Amortización</CardTitle>
          <Progress value={(schedulePage / totalPages) * 100} className="mt-2" />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Tabla</TabsTrigger>
              <TabsTrigger value="summary">Resumen</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Cuota</TableHead>
                      <TableHead>Interés</TableHead>
                      <TableHead>Capital</TableHead>
                      <TableHead>Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSchedule?.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        <TableCell>Bs. {row.payment.toFixed(2)}</TableCell>
                        <TableCell>Bs. {row.interest.toFixed(2)}</TableCell>
                        <TableCell>Bs. {row.principal.toFixed(2)}</TableCell>
                        <TableCell>Bs. {row.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSchedulePage(schedulePage - 1)}
                    disabled={schedulePage <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {schedulePage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSchedulePage(schedulePage + 1)}
                    disabled={schedulePage >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-2 pt-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Monto Solicitado</p>
                  <p className="text-lg font-semibold">Bs. {result.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Tasa Anual</p>
                  <p className="text-lg font-semibold">{result.annualRate}%</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Cuota Mensual</p>
                  <p className="text-lg font-semibold">Bs. {result.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Intereses</p>
                  <p className="text-lg font-semibold text-destructive">Bs. {result.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Apply button when simulation has an id (saved simulation) */}
      {result.id && (
        <Button
          onClick={() => router.push(`/portal/loans/new?simulationId=${result.id}`)}
          className="w-full"
        >
          Solicitar este préstamo
        </Button>
      )}
    </>
  );
}
