import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, createPresetByKey, createDefaultTemplate } from '../store/useStore';
import type { PresetKey } from '../store/useStore';
import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Download, Mail, X, Save, Pen } from 'lucide-react';
import { InvoicePDF } from '../components/InvoicePDF';
import { SignaturePad } from '../components/SignaturePad';
import { pdf } from '@react-pdf/renderer';
import { calculateTotal, formatCurrency, numberToWords } from '../utils/numberToWords';
import type { InvoiceTemplate, LineItem } from '../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm ' +
  'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors';

const labelCls = 'block text-xs font-medium text-text-tertiary mb-1.5';

const generateId = () => crypto.randomUUID();

function generateInvoiceName(t: InvoiceTemplate): string {
  const parts: string[] = [];
  if (t.invoiceNumber) parts.push(`Invoice #${t.invoiceNumber}`);
  if (t.signatory) parts.push(t.signatory);
  if (t.invoiceDate) parts.push(t.invoiceDate);
  return parts.length > 0 ? parts.join(' — ') : 'New Invoice';
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateStr(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InvoiceEditor() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const savedTemplate = useStore((s) => id ? s.templates.find((t) => t.id === id) : undefined);
  const saveTemplateToStore = useStore((s) => s.saveTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const addLineItem = useStore((s) => s.addLineItem);
  const updateLineItem = useStore((s) => s.updateLineItem);
  const removeLineItem = useStore((s) => s.removeLineItem);
  const settings = useStore((s) => s.settings);
  const savedSignatures = useStore((s) => s.savedSignatures);
  const saveSignature = useStore((s) => s.saveSignature);

  const isNew = !id;
  const presetKey = searchParams.get('preset') as PresetKey | null;
  const folderFromParam = searchParams.get('folder') || undefined;

  const [draft, setDraft] = useState<InvoiceTemplate | null>(() => {
    if (!isNew) return null;
    if (presetKey) {
      const preset = createPresetByKey(presetKey);
      return { ...preset, name: generateInvoiceName(preset), folderId: folderFromParam };
    }
    const t = createDefaultTemplate('New Invoice');
    return { ...t, folderId: folderFromParam };
  });

  const [isSaved, setIsSaved] = useState(!isNew);
  const nameManuallyEdited = useRef(false);
  const template = isNew ? draft : savedTemplate;

  const updateDraftTemplate = useCallback((updates: Partial<InvoiceTemplate>) => {
    setDraft(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev);
  }, []);

  const addDraftLineItem = useCallback(() => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        lineItems: [
          ...prev.lineItems,
          { id: generateId(), index: prev.lineItems.length + 1, description: '', unitCost: '', quantity: '1', price: '' },
        ],
      };
    });
  }, []);

  const updateDraftLineItem = useCallback((itemId: string, updates: Partial<LineItem>) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        lineItems: prev.lineItems.map(li => li.id === itemId ? { ...li, ...updates } : li),
      };
    });
  }, []);

  const removeDraftLineItem = useCallback((itemId: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        lineItems: prev.lineItems
          .filter(li => li.id !== itemId)
          .map((li, i) => ({ ...li, index: i + 1 })),
      };
    });
  }, []);

  const doUpdate = (updates: Partial<InvoiceTemplate>) => {
    if (!template) return;
    const autoNameFields = ['signatory', 'invoiceNumber', 'invoiceDate'] as const;
    const shouldAutoName = !nameManuallyEdited.current &&
      autoNameFields.some((f) => f in updates);
    const merged = { ...template, ...updates };
    const allUpdates = shouldAutoName
      ? { ...updates, name: generateInvoiceName(merged) }
      : updates;
    if (isNew) updateDraftTemplate(allUpdates);
    else updateTemplate(template.id, allUpdates);
  };

  const doAddLineItem = () => {
    if (isNew) addDraftLineItem();
    else if (template) addLineItem(template.id);
  };

  const doUpdateLineItem = (itemId: string, updates: Partial<LineItem>) => {
    if (isNew) updateDraftLineItem(itemId, updates);
    else if (template) updateLineItem(template.id, itemId, updates);
  };

  const doRemoveLineItem = (itemId: string) => {
    if (isNew) removeDraftLineItem(itemId);
    else if (template) removeLineItem(template.id, itemId);
  };

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

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

  const emailSubject = [
    template.invoiceNumber ? `Invoice #${template.invoiceNumber}` : 'Invoice',
    template.signatory,
    template.invoiceDate,
  ].filter(Boolean).join(' — ');

  const handleSave = () => {
    saveTemplateToStore(template);
    setIsSaved(true);
    if (isNew) {
      navigate(`/editor/${template.id}`, { replace: true });
    }
  };

  const handleDownloadPDF = async () => {
    if (!isSaved || isNew) {
      saveTemplateToStore(template);
      setIsSaved(true);
      if (isNew) {
        navigate(`/editor/${template.id}`, { replace: true });
      }
    }
    const doc = <InvoicePDF template={template} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = [
      'invoice',
      template.invoiceNumber,
      template.signatory,
    ].filter(Boolean).join('_').replace(/\s+/g, '_') + '.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!emailTo) return;
    if (!settings.email.resendApiKey) {
      alert('Please configure your Resend API key in Settings first.');
      return;
    }
    setEmailSending(true);
    try {
      const doc = <InvoicePDF template={template} />;
      const blob = await pdf(doc).toBlob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const filename = [
        'invoice',
        template.invoiceNumber,
        template.signatory,
      ].filter(Boolean).join('_').replace(/\s+/g, '_') + '.pdf';

      const fromEmail = settings.email.senderEmail || 'onboarding@resend.dev';
      const fromName = settings.email.senderName || 'Invoice Generator';

      const res = await fetch('/api/resend/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.email.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [emailTo],
          subject: emailSubject,
          text: `Please find the attached invoice.\n\nBest regards,\n${fromName}`,
          attachments: [{ filename, content: base64 }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to send email');
      }

      setShowEmailModal(false);
    } catch (err) {
      alert(`Failed to send: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-6 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-neutral-100 text-text-tertiary hover:text-text-primary
              transition-colors cursor-pointer bg-transparent border-none shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <input
            type="text"
            value={template.name}
            onChange={(e) => { nameManuallyEdited.current = true; doUpdate({ name: e.target.value }); }}
            className="text-xl font-semibold tracking-tight bg-transparent border-none outline-none
              focus:ring-0 min-w-0 flex-1 truncate"
          />
          {!isSaved && (
            <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full font-medium shrink-0">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              border border-accent text-accent hover:bg-accent/5
              transition-colors cursor-pointer bg-transparent"
          >
            <Save size={15} />
            Save
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
              border border-border text-text-secondary hover:text-text-primary hover:bg-neutral-50
              transition-colors cursor-pointer bg-transparent"
          >
            <Mail size={15} />
            Send
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">

        {/* Invoice number + Purchase order */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Invoice number</label>
              <input
                type="text"
                value={template.invoiceNumber}
                onChange={(e) => doUpdate({ invoiceNumber: e.target.value })}
                placeholder="#001"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Purchase order</label>
              <input
                type="text"
                value={template.contractRef}
                onChange={(e) => doUpdate({ contractRef: e.target.value })}
                placeholder="e.g. SM02"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Currency + Dates */}
        <div className="px-6 pt-5 pb-5 border-b border-border">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Currency</label>
              <select
                value={template.currency}
                onChange={(e) => doUpdate({ currency: e.target.value })}
                className={inputCls}
              >
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
                <option value="GBP">🇬🇧 GBP</option>
                <option value="UAH">🇺🇦 UAH</option>
                <option value="PLN">🇵🇱 PLN</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Invoice date</label>
              <DatePicker
                selected={parseDate(template.invoiceDate)}
                onChange={(date: Date | null) => doUpdate({ invoiceDate: formatDateStr(date) })}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Due date</label>
              <DatePicker
                selected={parseDate(template.dueDate)}
                onChange={(date: Date | null) => doUpdate({ dueDate: formatDateStr(date) })}
                dateFormat="MMM d, yyyy"
                placeholderText="Select date"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Company details + Bill to */}
        <div className="px-6 pt-5 pb-5 border-b border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Your company details</label>
              <textarea
                value={template.companyDetails}
                onChange={(e) => doUpdate({ companyDetails: e.target.value })}
                rows={6}
                placeholder={"Company name\nTax ID / ITN\nAddress\nEmail"}
                className={`${inputCls} resize-y`}
              />
            </div>
            <div>
              <label className={labelCls}>Bill to</label>
              <textarea
                value={template.billTo}
                onChange={(e) => doUpdate({ billTo: e.target.value })}
                rows={6}
                placeholder={"Client company name\nCompany number\nAddress\nVAT number"}
                className={`${inputCls} resize-y`}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-6 py-5 border-b border-border bg-surface-secondary">
          <div className="grid gap-3 mb-2" style={{ gridTemplateColumns: '1fr 120px 80px 120px 32px' }}>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Item description</span>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Unit cost</span>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Quantity</span>
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Amount</span>
            <span />
          </div>

          <div className="space-y-2">
            {template.lineItems.map((item, idx) => {
              const computedAmount = (parseFloat(item.unitCost) || 0) * (parseFloat(item.quantity) || 0);
              return (
                <div key={item.id} className="grid gap-3 items-center" style={{ gridTemplateColumns: '1fr 120px 80px 120px 32px' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-tertiary font-mono w-5 text-right shrink-0">{idx + 1}</span>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => doUpdateLineItem(item.id, { description: e.target.value })}
                      placeholder="Description of services"
                      className={inputCls}
                    />
                  </div>
                  <input
                    type="text"
                    value={item.unitCost}
                    onChange={(e) => {
                      const uc = e.target.value;
                      const amt = (parseFloat(uc) || 0) * (parseFloat(item.quantity) || 0);
                      doUpdateLineItem(item.id, { unitCost: uc, price: amt ? amt.toFixed(2) : '' });
                    }}
                    placeholder="0.00"
                    className={`${inputCls} text-right`}
                  />
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = e.target.value;
                      const amt = (parseFloat(item.unitCost) || 0) * (parseFloat(qty) || 0);
                      doUpdateLineItem(item.id, { quantity: qty, price: amt ? amt.toFixed(2) : '' });
                    }}
                    placeholder="1"
                    className={`${inputCls} text-right`}
                  />
                  <div className={`${inputCls} text-right bg-surface-tertiary border-transparent!`}>
                    {computedAmount ? formatCurrency(computedAmount) : '0'}
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => doRemoveLineItem(item.id)}
                      disabled={template.lineItems.length <= 1}
                      className="p-1.5 rounded-md text-text-tertiary hover:text-danger hover:bg-red-50
                        transition-colors cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={doAddLineItem}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent
              hover:text-accent-hover cursor-pointer bg-transparent border-none"
          >
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            Add item
          </button>
        </div>

        {/* Bottom: Notes + Bank details / Totals */}
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>Notes / payment terms</label>
              <textarea
                rows={3}
                placeholder="Payment is due within 15 days"
                className={`${inputCls} resize-y`}
                value={template.notes}
                onChange={(e) => doUpdate({ notes: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Bank account details</label>
              <textarea
                rows={5}
                placeholder={"IBAN: ...\nBank: ...\nSWIFT: ..."}
                className={`${inputCls} resize-y`}
                value={template.bankDetails}
                onChange={(e) => doUpdate({ bankDetails: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Signatory</label>
              <input
                type="text"
                value={template.signatory}
                onChange={(e) => doUpdate({ signatory: e.target.value })}
                placeholder="Full name"
                className={inputCls}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0!'}>Signature</label>
                {!showSignaturePad && !template.signatureImage && (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(true)}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover
                      cursor-pointer bg-transparent border-none"
                  >
                    <Pen size={12} />
                    Draw
                  </button>
                )}
              </div>
              {template.signatureImage && !showSignaturePad ? (
                <div className="border border-border rounded-lg bg-white p-2 relative group">
                  <img src={template.signatureImage} alt="Signature" className="h-16 object-contain" />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="px-2 py-0.5 rounded text-xs bg-surface border border-border
                        text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      Redraw
                    </button>
                    <button
                      type="button"
                      onClick={() => doUpdate({ signatureImage: undefined })}
                      className="px-2 py-0.5 rounded text-xs bg-surface border border-border
                        text-text-secondary hover:text-danger cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : showSignaturePad ? (
                <SignaturePad
                  initialImage={template.signatureImage || (template.signatory ? savedSignatures[template.signatory] : undefined)}
                  onSave={(dataUrl) => {
                    doUpdate({ signatureImage: dataUrl });
                    if (template.signatory) saveSignature(template.signatory, dataUrl);
                    setShowSignaturePad(false);
                  }}
                  onClear={() => doUpdate({ signatureImage: undefined })}
                />
              ) : (
                template.signatory && savedSignatures[template.signatory] ? (
                  <button
                    type="button"
                    onClick={() => {
                      doUpdate({ signatureImage: savedSignatures[template.signatory] });
                    }}
                    className="text-xs text-accent hover:text-accent-hover cursor-pointer bg-transparent border-none"
                  >
                    Use saved signature for {template.signatory}
                  </button>
                ) : null
              )}
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-text-secondary">Subtotal</span>
              <span className="text-sm font-medium">
                {formatCurrency(total)} {template.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-text-secondary">Tax (0%)</span>
              <span className="text-sm text-text-tertiary">—</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-base font-semibold">Total</span>
              <span className="text-xl font-bold">
                {formatCurrency(total)} {template.currency}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Total in words</label>
                <button
                  onClick={() => doUpdate({ totalInWords: numberToWords(total, template.currency) })}
                  className="text-xs text-accent hover:text-accent-hover cursor-pointer bg-transparent border-none"
                >
                  Auto-fill
                </button>
              </div>
              <input
                type="text"
                value={template.totalInWords || numberToWords(total, template.currency)}
                onChange={(e) => doUpdate({ totalInWords: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 py-4 bg-surface-secondary border-t border-border flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 border-accent text-accent
              hover:bg-accent/5 transition-colors cursor-pointer bg-transparent"
          >
            Save
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-accent text-text-inverse
              hover:bg-accent-hover transition-colors cursor-pointer border-none"
          >
            Download the invoice
          </button>
        </div>
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
                <label className={labelCls}>To</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="recipient@company.com"
                  autoFocus
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Subject</label>
                <p className="text-sm text-text-primary">{emailSubject}</p>
              </div>
              {!settings.email.resendApiKey && (
                <p className="text-xs text-warning">
                  Resend API key not configured. Go to Settings to add it.
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
