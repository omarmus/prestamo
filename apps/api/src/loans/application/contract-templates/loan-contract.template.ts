import PDFDocument from 'pdfkit';

export interface InstallmentRow {
  number: number;
  dueDate: Date;
  principal: number;
  interest: number;
  total: number;
}

export interface ContractTemplateData {
  loanId: string;
  amount: number;
  termMonths: number;
  annualRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  disbursedAt: Date;
  installments: InstallmentRow[];
  customer: {
    firstName: string;
    lastName: string | null;
    documentNumber: string | null;
  };
  lender: { name: string };
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Generates a loan contract PDF buffer using pdfkit.
 * ponytail: pdfmake had tsx/esbuild compat issues (getBuffer never calls back).
 * pdfkit is lower-level but reliable with tsx.
 */
export function buildLoanContractPdf(data: ContractTemplateData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { customer, lender, installments } = data;
    const borrowerName = customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.firstName;
    const docNumber = customer.documentNumber ?? '—';

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text(lender.name, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).text('CONTRATO DE PRÉSTAMO', { align: 'center' });
    doc.moveDown(0.5);

    // Separator line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.5);

    // Borrower info
    doc.fontSize(11).font('Helvetica-Bold').text('DATOS DEL PRESTATARIO');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nombre: ${borrowerName}`);
    doc.text(`Documento: ${docNumber}`);
    doc.moveDown(0.5);

    // Loan details
    doc.font('Helvetica-Bold').fontSize(11).text('DETALLES DEL PRÉSTAMO');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Monto: ${formatCurrency(data.amount)}`);
    doc.text(`Tasa de interés anual: ${data.annualRate}%`);
    doc.text(`Plazo: ${data.termMonths} meses`);
    doc.text(`Pago mensual: ${formatCurrency(data.monthlyPayment)}`);
    doc.text(`Interés total: ${formatCurrency(data.totalInterest)}`);
    doc.text(`Pago total: ${formatCurrency(data.totalPayment)}`);
    doc.text(`Fecha de desembolso: ${formatDate(data.disbursedAt)}`);
    doc.moveDown(0.5);

    // Amortization table
    doc.font('Helvetica-Bold').fontSize(11).text('TABLA DE AMORTIZACIÓN');
    doc.moveDown(0.3);

    const columns = ['#', 'Vencimiento', 'Cuota', 'Interés', 'Capital'];
    const colX = [50, 90, 210, 310, 410];
    const colWidths = [35, 115, 95, 95, 95];

    doc.font('Helvetica-Bold').fontSize(9);
    columns.forEach((col, i) => {
      doc.text(col, colX[i], doc.y, { width: colWidths[i] });
    });

    // Table header underline
    const headerY = doc.y;
    doc.moveTo(50, headerY).lineTo(545, headerY).strokeColor('#cccccc').stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    for (const inst of installments) {
      const y = doc.y;
      doc.text(String(inst.number), colX[0], y, { width: colWidths[0] });
      doc.text(formatDate(inst.dueDate), colX[1], y, { width: colWidths[1] });
      doc.text(formatCurrency(inst.total), colX[2], y, { width: colWidths[2] });
      doc.text(formatCurrency(inst.interest), colX[3], y, { width: colWidths[3] });
      doc.text(formatCurrency(inst.principal), colX[4], y, { width: colWidths[4] });
      doc.moveDown(0.4);
    }

    // Footer
    const footerY = Math.max(doc.y + 40, 650);
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#cccccc').stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    const lineY = doc.y;
    doc.text('_________________________', 100, lineY);
    doc.text('_________________________', 350, lineY);
    doc.moveDown(0.2);
    doc.fontSize(8).text('Firma del Prestatario', 100, doc.y, { width: 150, align: 'center' });
    doc.text('Firma del Prestamista', 350, doc.y - 10, { width: 150, align: 'center' });

    doc.fontSize(7).fillColor('#999999').text(
      `Documento generado el ${formatDate(new Date())} · ID: ${data.loanId}`,
      50, 700,
      { align: 'center', width: 500 },
    );

    doc.end();
  });
}
