import * as XLSX from 'xlsx';
import { PurchaseOrder } from '../types';
import { formatDate } from './calculations';

export function exportOrderToExcel(order: PurchaseOrder) {
  // Order Header Information
  const headerData = [
    ['ZNK ATELIER - ORDEM DE COMPRA DE CONFECÇÃO'],
    ['Número do Pedido:', order.orderNumber, 'Status:', order.status.toUpperCase()],
    ['Fornecedor:', order.supplierTradeName || order.supplierName, 'CNPJ:', order.supplierCnpj],
    ['Contato:', order.supplierContact, 'Telefone:', order.supplierPhone],
    ['Data de Emissão:', formatDate(order.issueDate), 'Previsão de Entrega:', formatDate(order.expectedDeliveryDate)],
    ['Condição de Pagamento:', order.paymentTerms, 'Coleção:', order.collection],
    ['Transportadora:', order.shippingCarrier || 'A combinar', 'Observações:', order.notes],
    [], // Empty row
    ['#', 'REF / SKU', 'DESCRIÇÃO DO MODELO', 'CATEGORIA', 'GRADE / TAMANHO', 'COR / VARIANTE', 'QTD (UN)', 'CUSTO UNIT. (R$)', 'SUBTOTAL (R$)'],
  ];

  // Items rows
  const itemRows = order.items.map((item, idx) => [
    idx + 1,
    item.sku,
    item.description,
    item.category,
    item.size,
    item.color,
    Number(item.quantity) || 0,
    Number(item.unitCost) || 0,
    Number(item.subtotal) || 0,
  ]);

  const itemsSubtotal = order.items.reduce((acc, i) => acc + i.subtotal, 0);

  // Footer rows
  const footerRows = [
    [],
    ['', '', '', '', '', 'TOTAL DE PEÇAS:', order.totalPieces, 'SUBTOTAL ITENS:', itemsSubtotal],
    ['', '', '', '', '', '', '', 'FRETE (+):', Number(order.shippingCost) || 0],
    ['', '', '', '', '', '', '', 'DESCONTO (-):', Number(order.discount) || 0],
    ['', '', '', '', '', '', '', 'VALOR TOTAL (R$):', order.totalAmount],
  ];

  const fullData = [...headerData, ...itemRows, ...footerRows];

  const ws = XLSX.utils.aoa_to_sheet(fullData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 40 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Pedido_${order.orderNumber}`);

  const filename = `Ordem_Compra_${order.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportOrdersListToExcel(orders: PurchaseOrder[]) {
  const data = orders.map((o, idx) => ({
    '#': idx + 1,
    'Nº Pedido': o.orderNumber,
    'Fornecedor': o.supplierTradeName || o.supplierName,
    'Status': o.status,
    'Emissão': formatDate(o.issueDate),
    'Previsão Entrega': formatDate(o.expectedDeliveryDate),
    'Total Peças': o.totalPieces,
    'Valor Total (R$)': o.totalAmount,
    'Condição Pagamento': o.paymentTerms,
    'Coleção': o.collection,
    'Transportadora': o.shippingCarrier || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Pedidos');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Relatorio_Pedidos_ZNK_${today}.xlsx`);
}
