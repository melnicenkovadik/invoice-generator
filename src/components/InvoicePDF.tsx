import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { InvoiceTemplate } from '../types';
import { calculateTotal, formatCurrency, numberToWords } from '../utils/numberToWords';

const c = {
  black: '#1c1917',
  gray: '#57534e',
  lightGray: '#78716c',
  border: '#e7e5e4',
  bg: '#fafaf9',
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.black,
    lineHeight: 1.5,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
    marginBottom: 12,
  },
  contractRef: {
    fontSize: 9,
    color: c.gray,
    marginTop: 0,
  },

  // Two columns
  twoCol: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  col: { flex: 1 },
  colLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.lightGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  colText: {
    fontSize: 8.5,
    color: c.black,
    lineHeight: 1.6,
  },
  subLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.lightGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
  },

  // Items table
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: c.bg,
    borderTopWidth: 1,
    borderTopColor: c.border,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: c.lightGray,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  },
  colNo: { width: 24, flexShrink: 0 },
  colDesc: { flex: 1 },
  colUnitCost: { width: 70, textAlign: 'right' },
  colQty: { width: 50, textAlign: 'right' },
  colAmt: { width: 70, textAlign: 'right' },

  // Totals
  totalsBlock: {
    marginTop: 4,
    marginBottom: 8,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: c.black,
    width: 120,
    textAlign: 'right',
  },
  totalWords: {
    fontSize: 8,
    color: c.gray,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },

  // Notes
  notesBlock: {
    marginTop: 16,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
  },
  notesLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.lightGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: c.gray,
    lineHeight: 1.5,
  },

  // Signature
  signature: {
    marginTop: 40,
  },
  signBlock: { width: 200 },
  signRole: {
    fontSize: 7.5,
    color: c.lightGray,
    marginBottom: 3,
  },
  signName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 14,
  },
  signDateLine: {
    fontSize: 8.5,
    color: c.gray,
  },
});

export function InvoicePDF({ template }: { template: InvoiceTemplate }) {
  const total = calculateTotal(template.lineItems.map((li) => li.price));

  const dateDisplay = template.invoiceDate && template.dueDate
    ? `from ${template.invoiceDate} to ${template.dueDate}`
    : template.invoiceDate
      ? `from ${template.invoiceDate}`
      : template.dueDate
        ? `due ${template.dueDate}`
        : '';

  const wordsText = template.totalInWords || numberToWords(total, template.currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.invoiceTitle}>
            INVOICE{template.invoiceNumber ? ` № ${template.invoiceNumber}` : ''}
          </Text>
          {template.contractRef ? (
            <Text style={styles.contractRef}>
              to Contract No. {template.contractRef}{dateDisplay ? ` ${dateDisplay}` : ''}
            </Text>
          ) : dateDisplay ? (
            <Text style={styles.contractRef}>
              {dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1)}
            </Text>
          ) : null}
        </View>

        {/* Contractor / Customer */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            {template.companyDetails && (
              <>
                <Text style={styles.colLabel}>Contractor</Text>
                <Text style={styles.colText}>{template.companyDetails}</Text>
              </>
            )}
            {template.bankDetails && (
              <>
                <Text style={styles.subLabel}>Bank details</Text>
                <Text style={styles.colText}>{template.bankDetails}</Text>
              </>
            )}
          </View>
          <View style={styles.col}>
            {template.billTo && (
              <>
                <Text style={styles.colLabel}>Customer</Text>
                <Text style={styles.colText}>{template.billTo}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colNo }}>№</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colDesc }}>Description</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colUnitCost }}>Unit cost</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colQty }}>Qty</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colAmt }}>
              Amount, {template.currency}
            </Text>
          </View>

          {template.lineItems.map((item) => {
            const amt = (parseFloat(item.unitCost) || 0) * (parseFloat(item.quantity) || 0);
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={{ ...styles.colNo, fontSize: 8.5, color: c.lightGray }}>{item.index}</Text>
                <Text style={{ ...styles.colDesc, fontSize: 8.5 }}>{item.description}</Text>
                <Text style={{ ...styles.colUnitCost, fontSize: 8.5 }}>
                  {item.unitCost ? formatCurrency(parseFloat(item.unitCost) || 0) : ''}
                </Text>
                <Text style={{ ...styles.colQty, fontSize: 8.5 }}>
                  {item.quantity || ''}
                </Text>
                <Text style={{ ...styles.colAmt, fontSize: 8.5 }}>
                  {amt ? formatCurrency(amt) : ''}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>TOTAL: </Text>
            <Text style={styles.totalValue}>{formatCurrency(total)} {template.currency}</Text>
          </View>
          <Text style={styles.totalWords}>
            TOTAL TO PAY: {wordsText}
          </Text>
        </View>

        {/* Notes */}
        {template.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{template.notes}</Text>
          </View>
        ) : null}

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signBlock}>
            {template.signatory && (
              <>
                <Text style={styles.signRole}>Private Entrepreneur</Text>
                <Text style={styles.signName}>{template.signatory}</Text>
              </>
            )}
            {template.signatureImage && (
              <Image src={template.signatureImage} style={{ width: 150, height: 50, marginBottom: 8 }} />
            )}
            {template.invoiceDate && (
              <Text style={styles.signDateLine}>{template.invoiceDate}</Text>
            )}
          </View>
        </View>

      </Page>
    </Document>
  );
}
