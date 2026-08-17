import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseOrder, StoreSettings } from '../types';
import { formatCurrency, formatDate, formatCNPJ, formatPhone, getDeliveryDeadlineStatus } from './calculations';

export function exportOrderToPdf(order: PurchaseOrder, customStore?: StoreSettings) {
  const store = customStore || {
    storeName: 'ZNK PACKING',
    tagline: 'MODA FEMININA & CONFECÇÃO PREMIUM',
    legalName: 'ZNK Comércio de Roupas Femininas Ltda',
    cnpj: '42.190.876/0001-33',
    email: 'compras@znkatelier.com.br',
    phone: '11976543210',
    address: 'Rua Oscar Freire, 1420',
    city: 'São Paulo',
    state: 'SP',
    currencySymbol: 'R$',
    footerNote: 'Ordem de Compra oficial de confecção.',
    logoIcon: 'Crown',
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [176, 125, 79]; // Brand terracotta/caramel (#B07D4F)
  const darkTextColor: [number, number, number] = [34, 28, 24];
  const mutedTextColor: [number, number, number] = [115, 107, 99];
  const tableHeaderColor: [number, number, number] = [244, 235, 225];
  const borderColor: [number, number, number] = [232, 226, 216];

  // Header background banner
  doc.setFillColor(250, 246, 240);
  doc.rect(0, 0, 210, 36, 'F');

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text((store.storeName || 'ZNK PACKING').toUpperCase(), 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text((store.tagline || 'MODA FEMININA & CONFECÇÃO PREMIUM').toUpperCase(), 14, 22);
  doc.text(`CNPJ: ${formatCNPJ(store.cnpj)} | ${store.email || ''}`, 14, 27);

  // Document Title & Order Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('ORDEM DE COMPRA', 196, 15, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Nº ${order.orderNumber}`, 196, 22, { align: 'right' });

  const deadline = getDeliveryDeadlineStatus(order.expectedDeliveryDate, order.status);
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Status: ${order.status.toUpperCase()} (${deadline.shortLabel})`, 196, 28, { align: 'right' });

  // Divider line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  // Information Grid: 2 boxes (Buyer & Supplier)
  let y = 43;

  // Box 1: Supplier Info
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(232, 226, 216);
  doc.roundedRect(14, y, 88, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DADOS DO FORNECEDOR', 18, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(order.supplierTradeName || order.supplierName, 18, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Razão Social: ${order.supplierName}`, 18, y + 17);
  doc.text(`CNPJ: ${formatCNPJ(order.supplierCnpj || '')}`, 18, y + 22);
  doc.text(`Contato: ${order.supplierContact || '-'}`, 18, y + 27);
  doc.text(`Tel/Whats: ${formatPhone(order.supplierPhone || '')} | ${order.supplierEmail || ''}`, 18, y + 32);

  // Box 2: Order Terms & Conditions
  doc.roundedRect(108, y, 88, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CONDIÇÕES DO PEDIDO', 112, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Data de Emissão:`, 112, y + 12);
  doc.text(formatDate(order.issueDate), 160, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text(`Previsão de Entrega:`, 112, y + 17);
  doc.text(formatDate(order.expectedDeliveryDate), 160, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.text(`Condição de Pagto:`, 112, y + 22);
  doc.text(order.paymentTerms || 'Conforme combinado', 145, y + 22);

  doc.text(`Coleção:`, 112, y + 27);
  doc.text(order.collection || 'Geral', 145, y + 27);

  doc.text(`Transportadora:`, 112, y + 32);
  doc.text(order.shippingCarrier || 'A combinar / FOB', 145, y + 32);

  y += 44;

  // Table of Items
  const tableData = order.items.map((item, index) => [
    (index + 1).toString(),
    item.sku || '-',
    item.description || '-',
    item.category || '-',
    item.size || '-',
    item.color || '-',
    item.quantity.toString(),
    formatCurrency(item.unitCost),
    formatCurrency(item.subtotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'REF/SKU', 'DESCRIÇÃO DO PRODUTO', 'CATEGORIA', 'GRADE', 'COR/VARIANTE', 'QTD', 'CUSTO UNIT.', 'SUBTOTAL']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: tableHeaderColor,
      textColor: darkTextColor,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: darkTextColor,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
      6: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Summary and Observations Section
  const remainingSpace = 280 - finalY;
  if (remainingSpace < 45) {
    doc.addPage();
    y = 20;
  } else {
    y = finalY;
  }

  // Left column: Observations
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(232, 226, 216);
  doc.roundedRect(14, y, 105, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('OBSERVAÇÕES & INSTRUÇÕES DE ENTREGA', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  const splitNotes = doc.splitTextToSize(
    order.notes || 'Sem observações adicionais. Embalar com identificação clara de referências.',
    98
  );
  doc.text(splitNotes, 18, y + 12);

  // Right column: Financial Totals Box
  doc.setFillColor(250, 246, 240);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(125, y, 71, 36, 2, 2, 'FD');

  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Total de Peças:', 130, y + 8);
  doc.text(`${order.totalPieces} un`, 190, y + 8, { align: 'right' });

  doc.text('Subtotal Produtos:', 130, y + 14);
  doc.text(formatCurrency(itemsSubtotal), 190, y + 14, { align: 'right' });

  if (order.shippingCost) {
    doc.text('Frete (+):', 130, y + 19);
    doc.text(formatCurrency(order.shippingCost), 190, y + 19, { align: 'right' });
  }

  if (order.discount) {
    doc.text('Desconto (-):', 130, y + 24);
    doc.text(formatCurrency(order.discount), 190, y + 24, { align: 'right' });
  }

  doc.setDrawColor(218, 191, 160);
  doc.line(130, y + 27, 190, y + 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('VALOR TOTAL:', 130, y + 33);
  doc.text(formatCurrency(order.totalAmount), 190, y + 33, { align: 'right' });

  // Signatures at bottom
  y += 48;
  if (y > 270) {
    doc.addPage();
    y = 30;
  }

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(20, y + 10, 85, y + 10);
  doc.line(125, y + 10, 190, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`${(store.storeName || 'ZNK PACKING').toUpperCase()} - Compras / Produção`, 52.5, y + 14, { align: 'center' });
  doc.text('Aceite e De Acordo do Fornecedor', 157.5, y + 14, { align: 'center' });

  // Save the PDF
  const filename = `Ordem_Compra_${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  doc.save(filename);
}
