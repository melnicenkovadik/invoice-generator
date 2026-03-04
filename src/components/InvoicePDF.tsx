import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceTemplate } from '../types';
import { calculateTotal, formatCurrency, numberToWords } from '../utils/numberToWords';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1c1917',
    lineHeight: 1.5,
  },
  header: {
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: '#57534e',
    marginBottom: 20,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    width: 100,
    color: '#78716c',
    fontSize: 8,
  },
  value: {
    flex: 1,
    fontSize: 9,
  },
  table: {
    marginTop: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#57534e',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e7e5e4',
  },
  colNo: { width: 30 },
  colDesc: { flex: 1 },
  colPrice: { width: 100, textAlign: 'right' },
  totalSection: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    paddingVertical: 4,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    width: 120,
    textAlign: 'right',
  },
  totalWords: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signLine: {
    width: 200,
  },
  signLabel: {
    fontSize: 8,
    color: '#78716c',
    marginBottom: 4,
  },
  signName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 16,
  },
  dateLine: {
    fontSize: 9,
    marginTop: 4,
  },
});

function getField(template: InvoiceTemplate, key: string): string {
  return template.fields.find((f) => f.key === key)?.value || '';
}

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function InvoicePDF({ template }: { template: InvoiceTemplate }) {
  const total = calculateTotal(template.lineItems.map((li) => li.price));
  const invoiceNum = getField(template, 'invoiceNumber');
  const contractRef = getField(template, 'contractRef');
  const contractDate = getField(template, 'contractDate');

  const contractorFields = template.fields.filter((f) => f.group === 'contractor');
  const bankFields = template.fields.filter((f) => f.group === 'bank');
  const customerFields = template.fields.filter((f) => f.group === 'customer');
  const customFields = template.fields.filter((f) => f.group === 'custom' && f.value);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE {invoiceNum ? `№ ${invoiceNum}` : ''}</Text>
          {contractRef && (
            <Text style={styles.subtitle}>
              to Contract No. {contractRef}
              {contractDate ? ` dated ${contractDate}` : ''}
            </Text>
          )}
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Contractor</Text>
            {contractorFields.map((f) => (
              <FieldRow key={f.id} label={f.label} value={f.value} />
            ))}

            <Text style={{ ...styles.sectionTitle, marginTop: 12 }}>Bank Details</Text>
            {bankFields.map((f) => (
              <FieldRow key={f.id} label={f.label} value={f.value} />
            ))}
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Customer</Text>
            {customerFields.map((f) => (
              <FieldRow key={f.id} label={f.label} value={f.value} />
            ))}

            {customFields.length > 0 && (
              <>
                <Text style={{ ...styles.sectionTitle, marginTop: 12 }}>Additional</Text>
                {customFields.map((f) => (
                  <FieldRow key={f.id} label={f.label} value={f.value} />
                ))}
              </>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colNo }}>№</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colDesc }}>Description</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.colPrice }}>
              Price, {template.currency}
            </Text>
          </View>
          {template.lineItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colNo}>{item.index}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colPrice}>
                {item.price ? formatCurrency(parseFloat(item.price) || 0) : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(total)} {template.currency}
            </Text>
          </View>
          <Text style={styles.totalWords}>
            TOTAL TO PAY:{' '}
            {template.totalInWords || numberToWords(total, template.currency)}
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signLine}>
            {template.signatory && (
              <>
                <Text style={styles.signLabel}>Private Entrepreneur</Text>
                <Text style={styles.signName}>{template.signatory}</Text>
              </>
            )}
            <Text style={styles.dateLine}>Date: ___ / ___ / {new Date().getFullYear()}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
