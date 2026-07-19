'use client';

import { useState } from 'react';
import { useSimulator } from '@/features/portal/hooks/use-simulator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/ui/card';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Progress } from '@/components/atoms/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { Calculator, Loader2 } from 'lucide-react';

export default function SimulatorPage() {
  const { lastResult, isLoading, error, simulate } = useSimulator();
  const [amount, setAmount] = useState('10000');
  const [termMonths, setTermMonths] = useState('12');
  const [annualRate, setAnnualRate] = useState('12');
  const [schedulePage, setSchedulePage] = useState(1);
  const rowsPerPage = 12;

  const handleSimulate = async () => {
    await simulate({
      amount: Number(amount),
      termMonths: Number(termMonths),
      annualRate: Number(annualRate),
    });
  };

  const totalPages = lastResult ? Math.ceil(lastResult.schedule.length / rowsPerPage) : 1;
  const paginatedSchedule = lastResult?.schedule.slice(
    (schedulePage - 1) * rowsPerPage,
    schedulePage * rowsPerPage,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simulador de Préstamos</h1>
        <p className="text-muted-foreground">Calculá tus cuotas mensuales simulando un préstamo</p>
      </div>

      {/* Calculator form */}
      <Card>
        <CardHeader><CardTitle>Datos del Préstamo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Monto (Bs.)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={100} />
            </div>
            <div className="space-y-2">
              <Label>Plazo (meses)</Label>
              <Input type="number" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} min={1} max={120} />
            </div>
            <div className="space-y-2">
              <Label>Tasa Anual (%)</Label>
              <Input type="number" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} min={0.1} step={0.1} />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSimulate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
            Simular
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {error && <p className="text-destructive">{error}</p>}

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {lastResult && !isLoading && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cuota Mensual</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">Bs. {lastResult.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total a Pagar</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">Bs. {lastResult.totalPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Intereses</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-destructive">Bs. {lastResult.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plazo</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{lastResult.termMonths} meses</p></CardContent>
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
                      <p className="text-lg font-semibold">Bs. {lastResult.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Tasa Anual</p>
                      <p className="text-lg font-semibold">{lastResult.annualRate}%</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Cuota Mensual</p>
                      <p className="text-lg font-semibold">Bs. {lastResult.monthlyPayment.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Total Intereses</p>
                      <p className="text-lg font-semibold text-destructive">Bs. {lastResult.totalInterest.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
