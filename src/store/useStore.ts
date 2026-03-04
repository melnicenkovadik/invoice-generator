import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InvoiceTemplate, AppSettings, InvoiceField, LineItem } from '../types';

const generateId = () => crypto.randomUUID();

const DEFAULT_FIELDS: InvoiceField[] = [
  { id: generateId(), key: 'invoiceNumber', label: 'Invoice №', value: '', type: 'text', group: 'meta' },
  { id: generateId(), key: 'contractRef', label: 'Contract Reference', value: '', type: 'text', group: 'meta' },
  { id: generateId(), key: 'contractDate', label: 'Contract Date', value: '', type: 'text', group: 'meta' },

  { id: generateId(), key: 'contractorName', label: 'Contractor Name', value: '', type: 'text', group: 'contractor' },
  { id: generateId(), key: 'contractorITN', label: 'ITN (Tax Number)', value: '', type: 'text', group: 'contractor' },
  { id: generateId(), key: 'contractorAddress', label: 'Address', value: '', type: 'textarea', group: 'contractor' },
  { id: generateId(), key: 'contractorEmail', label: 'Email', value: '', type: 'text', group: 'contractor' },

  { id: generateId(), key: 'bankIBAN', label: 'IBAN', value: '', type: 'text', group: 'bank' },
  { id: generateId(), key: 'bankAccount', label: 'Account', value: '', type: 'text', group: 'bank' },
  { id: generateId(), key: 'bankName', label: 'Bank Name', value: '', type: 'text', group: 'bank' },
  { id: generateId(), key: 'bankAddress', label: 'Bank Address', value: '', type: 'textarea', group: 'bank' },
  { id: generateId(), key: 'bankSWIFT', label: 'SWIFT/BIC', value: '', type: 'text', group: 'bank' },
  { id: generateId(), key: 'corrBank', label: 'Correspondent Bank', value: '', type: 'text', group: 'bank' },
  { id: generateId(), key: 'corrBankSWIFT', label: 'Correspondent SWIFT', value: '', type: 'text', group: 'bank' },
  { id: generateId(), key: 'corrBankAccount', label: 'Correspondent Account', value: '', type: 'text', group: 'bank' },

  { id: generateId(), key: 'customerName', label: 'Customer / Company Name', value: '', type: 'text', group: 'customer' },
  { id: generateId(), key: 'customerNumber', label: 'Company Number', value: '', type: 'text', group: 'customer' },
  { id: generateId(), key: 'customerAddress', label: 'Address', value: '', type: 'textarea', group: 'customer' },
  { id: generateId(), key: 'customerVAT', label: 'VAT Number', value: '', type: 'text', group: 'customer' },
];

function createDefaultTemplate(name: string): InvoiceTemplate {
  return {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: DEFAULT_FIELDS.map(f => ({ ...f, id: generateId() })),
    lineItems: [{ id: generateId(), index: 1, description: '', price: '' }],
    totalInWords: '',
    signatory: '',
    currency: 'USD',
  };
}

interface InvoiceStore {
  templates: InvoiceTemplate[];
  settings: AppSettings;

  addTemplate: (name: string) => string;
  duplicateTemplate: (id: string) => string | null;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void;
  updateField: (templateId: string, fieldId: string, value: string) => void;
  addField: (templateId: string, field: Omit<InvoiceField, 'id'>) => void;
  removeField: (templateId: string, fieldId: string) => void;
  addLineItem: (templateId: string) => void;
  updateLineItem: (templateId: string, itemId: string, updates: Partial<LineItem>) => void;
  removeLineItem: (templateId: string, itemId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateEmailSettings: (email: Partial<AppSettings['email']>) => void;
}

export const useStore = create<InvoiceStore>()(
  persist(
    (set) => ({
      templates: [],
      settings: {
        email: {
          senderEmail: '',
          senderName: '',
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          useTLS: true,
        },
        defaultCurrency: 'USD',
        companyName: '',
      },

      addTemplate: (name: string) => {
        const template = createDefaultTemplate(name);
        set((state) => ({ templates: [...state.templates, template] }));
        return template.id;
      },

      duplicateTemplate: (id: string) => {
        let newId: string | null = null;
        set((state) => {
          const source = state.templates.find(t => t.id === id);
          if (!source) return state;
          const duplicate: InvoiceTemplate = {
            ...source,
            id: generateId(),
            name: `${source.name} (copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fields: source.fields.map(f => ({ ...f, id: generateId() })),
            lineItems: source.lineItems.map(li => ({ ...li, id: generateId() })),
          };
          newId = duplicate.id;
          return { templates: [...state.templates, duplicate] };
        });
        return newId;
      },

      deleteTemplate: (id: string) => {
        set((state) => ({ templates: state.templates.filter(t => t.id !== id) }));
      },

      updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      updateField: (templateId: string, fieldId: string, value: string) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  fields: t.fields.map(f => (f.id === fieldId ? { ...f, value } : f)),
                }
              : t
          ),
        }));
      },

      addField: (templateId: string, field: Omit<InvoiceField, 'id'>) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  fields: [...t.fields, { ...field, id: generateId() }],
                }
              : t
          ),
        }));
      },

      removeField: (templateId: string, fieldId: string) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  fields: t.fields.filter(f => f.id !== fieldId),
                }
              : t
          ),
        }));
      },

      addLineItem: (templateId: string) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  lineItems: [
                    ...t.lineItems,
                    { id: generateId(), index: t.lineItems.length + 1, description: '', price: '' },
                  ],
                }
              : t
          ),
        }));
      },

      updateLineItem: (templateId: string, itemId: string, updates: Partial<LineItem>) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  lineItems: t.lineItems.map(li => (li.id === itemId ? { ...li, ...updates } : li)),
                }
              : t
          ),
        }));
      },

      removeLineItem: (templateId: string, itemId: string) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  lineItems: t.lineItems
                    .filter(li => li.id !== itemId)
                    .map((li, i) => ({ ...li, index: i + 1 })),
                }
              : t
          ),
        }));
      },

      updateSettings: (updates: Partial<AppSettings>) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },

      updateEmailSettings: (email: Partial<AppSettings['email']>) => {
        set((state) => ({
          settings: { ...state.settings, email: { ...state.settings.email, ...email } },
        }));
      },
    }),
    {
      name: 'invoice-generator-storage',
    }
  )
);
