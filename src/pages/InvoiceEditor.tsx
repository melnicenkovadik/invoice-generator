import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Mail,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { InvoicePDF } from '../components/InvoicePDF';
import { pdf } from '@react-pdf/renderer';
import { calculateTotal, formatCurrency, numberToWords } from '../utils/numberToWords';
import type { InvoiceField } from '../types';

const GROUP_LABELS: Record<string, string> = {
  meta: 'Invoice Details',
  contractor: 'Contractor',
  bank: 'Bank Details',
  customer: 'Customer',
  custom: 'Custom Fields',
};

const GROUP_ORDER = ['meta', 'contractor', 'bank', 'customer', 'custom'];

export function InvoiceEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const template = useStore((s) => s.templates.find((t) => t.id === id));
  const updateTemplate = useStore((s) => s.updateTemplate);
  const updateField = useStore((s) => s.updateField);
  const addField = useStore((s) => s.addField);
  const removeField = useStore((s) => s.removeField);
  const addLineItem = useStore((s) => s.addLineItem);
  const updateLineItem = useStore((s) => s.updateLineItem);
  const removeLineItem = useStore((s) => s.removeLineItem);
  const settings = useStore((s) => s.settings);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'number'>('text');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  if (!template) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Invoice not found</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-accent hover:text-accent-hover text-sm cursor-pointer bg-transparent border-none"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const total = calculateTotal(template.lineItems.map((li) => li.price));

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    addField(template.id, {
      key: `custom_${Date.now()}`,
      label: newFieldLabel.trim(),
      value: '',
      type: newFieldType,
      group: 'custom',
      isCustom: true,
    });
    setNewFieldLabel('');
    setShowAddField(false);
  };

  const handleDownloadPDF = async () => {
    const doc = <InvoicePDF template={template} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${template.fields.find((f) => f.key === 'invoiceNumber')?.value || template.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!emailTo || !settings.email.smtpHost) {
      alert('Please configure email settings first (Settings page)');
      return;
    }
    setEmailSending(true);
    try {
      const doc = <InvoicePDF template={template} />;
      const blob = await pdf(doc).toBlob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        const mailtoSubject = encodeURIComponent(emailSubject || `Invoice ${template.fields.find((f) => f.key === 'invoiceNumber')?.value || ''}`);
        const mailtoBody = encodeURIComponent(
          `Please find the attached invoice.\n\nBest regards,\n${settings.email.senderName || 'Sender'}`
        );

        alert(
          `Email sending requires a backend server.\n\n` +
          `To: ${emailTo}\n` +
          `Subject: ${emailSubject}\n` +
          `Attachment: invoice.pdf (${(blob.size / 1024).toFixed(1)} KB)\n\n` +
          `As a workaround, the PDF has been downloaded. You can attach it manually.\n\n` +
          `Opening mailto link...`
        );

        window.location.href = `mailto:${emailTo}?subject=${mailtoSubject}&body=${mailtoBody}`;

        const downloadLink = document.createElement('a');
        downloadLink.href = `data:application/pdf;base64,${base64}`;
        downloadLink.download = `invoice_${template.fields.find((f) => f.key === 'invoiceNumber')?.value || template.id}.pdf`;
        downloadLink.click();

        setShowEmailModal(false);
        setEmailSending(false);
      };
    } catch {
      alert('Failed to generate PDF');
      setEmailSending(false);
    }
  };

  const fieldsByGroup = GROUP_ORDER.reduce<Record<string, InvoiceField[]>>((acc, group) => {
    const fields = template.fields.filter((f) => f.group === group);
    if (fields.length > 0) acc[group] = fields;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-neutral-100 text-text-tertiary hover:text-text-primary
              transition-colors cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft size={18} />
          </button>
          <input
            type="text"
            value={template.name}
            onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
            className="text-xl font-semibold tracking-tight bg-transparent border-none outline-none
              focus:ring-0 w-auto"
            style={{ width: `${Math.max(template.name.length, 10)}ch` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              border border-border text-text-secondary hover:text-text-primary hover:bg-neutral-50
              transition-colors cursor-pointer bg-transparent"
          >
            <Mail size={15} />
            Send
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              bg-primary text-text-inverse hover:bg-primary-hover transition-colors cursor-pointer border-none"
          >
            <Download size={15} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(fieldsByGroup).map(([group, fields]) => (
          <section key={group} className="bg-surface rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-transparent border-none
                cursor-pointer text-left hover:bg-neutral-50/50 transition-colors"
            >
              <span className="text-sm font-medium text-text-primary">
                {GROUP_LABELS[group] || group}
              </span>
              {collapsedGroups[group] ? (
                <ChevronRight size={16} className="text-text-tertiary" />
              ) : (
                <ChevronDown size={16} className="text-text-tertiary" />
              )}
            </button>
            {!collapsedGroups[group] && (
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-text-secondary">{field.label}</label>
                      {field.isCustom && (
                        <button
                          onClick={() => removeField(template.id, field.id)}
                          className="text-text-tertiary hover:text-danger p-0.5 cursor-pointer bg-transparent border-none"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={field.value}
                        onChange={(e) => updateField(template.id, field.id, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                          focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors resize-y"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => updateField(template.id, field.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                          focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Line Items */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-medium mb-4">Line Items</h3>
          <div className="space-y-3">
            {template.lineItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="text-xs text-text-tertiary font-mono mt-2.5 w-6 text-right shrink-0">
                  {item.index}
                </span>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(template.id, item.id, { description: e.target.value })}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                />
                <input
                  type="text"
                  value={item.price}
                  onChange={(e) => updateLineItem(template.id, item.id, { price: e.target.value })}
                  placeholder="0.00"
                  className="w-32 px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm text-right
                    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                />
                <button
                  onClick={() => removeLineItem(template.id, item.id)}
                  disabled={template.lineItems.length <= 1}
                  className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-red-50
                    transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addLineItem(template.id)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              text-accent hover:bg-accent/5 transition-colors cursor-pointer bg-transparent border-none"
          >
            <Plus size={14} />
            Add Item
          </button>
        </section>

        {/* Totals */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">
              {formatCurrency(total)} {template.currency}
            </span>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Total in Words</label>
            <input
              type="text"
              value={template.totalInWords || numberToWords(total, template.currency)}
              onChange={(e) => updateTemplate(template.id, { totalInWords: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
            <button
              onClick={() => updateTemplate(template.id, { totalInWords: numberToWords(total, template.currency) })}
              className="mt-1 text-xs text-accent hover:text-accent-hover cursor-pointer bg-transparent border-none"
            >
              Auto-generate from total
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Signatory</label>
              <input
                type="text"
                value={template.signatory}
                onChange={(e) => updateTemplate(template.id, { signatory: e.target.value })}
                placeholder="Name of signatory"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                  focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Currency</label>
              <select
                value={template.currency}
                onChange={(e) => updateTemplate(template.id, { currency: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                  focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="UAH">UAH</option>
                <option value="PLN">PLN</option>
              </select>
            </div>
          </div>
        </section>

        {/* Add Custom Field */}
        <section className="bg-surface rounded-xl border border-border p-5">
          {!showAddField ? (
            <button
              onClick={() => setShowAddField(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent
                hover:text-accent-hover cursor-pointer bg-transparent border-none"
            >
              <Plus size={16} />
              Add Custom Field
            </button>
          ) : (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Field Label</label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                  placeholder="e.g. Purchase Order"
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as 'text' | 'textarea' | 'number')}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                </select>
              </div>
              <button
                onClick={handleAddField}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-accent text-text-inverse
                  hover:bg-accent-hover transition-colors cursor-pointer border-none"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddField(false); setNewFieldLabel(''); }}
                className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-neutral-100
                  transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </section>

        {/* Remove Standard Fields */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-medium mb-3">Manage Default Fields</h3>
          <p className="text-xs text-text-tertiary mb-3">
            Click the trash icon to remove fields you don't need
          </p>
          <div className="flex flex-wrap gap-2">
            {template.fields
              .filter((f) => !f.isCustom)
              .map((field) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 text-xs text-text-secondary"
                >
                  {field.label}
                  <button
                    onClick={() => removeField(template.id, field.id)}
                    className="text-text-tertiary hover:text-danger cursor-pointer bg-transparent border-none p-0"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
          </div>
        </section>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Send Invoice</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded hover:bg-neutral-100 cursor-pointer bg-transparent border-none"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">To</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="recipient@company.com"
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={`Invoice ${template.fields.find((f) => f.key === 'invoiceNumber')?.value || ''}`}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
                />
              </div>
              {!settings.email.smtpHost && (
                <p className="text-xs text-warning">
                  SMTP not configured. Will use mailto link + PDF download as fallback.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-text-secondary
                  hover:bg-neutral-50 transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={emailSending || !emailTo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  bg-accent text-text-inverse hover:bg-accent-hover transition-colors cursor-pointer border-none
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail size={14} />
                {emailSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
