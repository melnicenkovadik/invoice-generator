import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { InvoiceTemplate, AppSettings, LineItem, Folder } from '../types';

const generateId = () => crypto.randomUUID();

// --- API storage adapter (NAS) with debounce ---

let saveTimer: ReturnType<typeof setTimeout> | undefined;

const apiStorage: StateStorage = {
  getItem: async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return null;
      const text = await res.text();
      return text === 'null' ? null : text;
    } catch {
      // Fallback to localStorage if API unavailable (local dev without server)
      return localStorage.getItem('invoice-generator-storage-v4');
    }
  },
  setItem: async (_name: string, value: string) => {
    // Always save to localStorage as immediate cache
    localStorage.setItem('invoice-generator-storage-v4', value);
    // Debounced save to API
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: value,
        });
      } catch {
        // API unavailable — data is safe in localStorage
      }
    }, 500);
  },
  removeItem: async () => {
    localStorage.removeItem('invoice-generator-storage-v4');
    try {
      await fetch('/api/data', { method: 'PUT', body: 'null', headers: { 'Content-Type': 'application/json' } });
    } catch { /* ignore */ }
  },
};

// Save pending data before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const pending = localStorage.getItem('invoice-generator-storage-v4');
    if (pending) {
      navigator.sendBeacon('/api/data', new Blob([pending], { type: 'application/json' }));
    }
  });
}

// --- Preset templates ---

export function createDefaultTemplate(name: string): InvoiceTemplate {
  return {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    invoiceNumber: '',
    contractRef: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'USD',
    companyDetails: '',
    billTo: '',
    lineItems: [{ id: generateId(), index: 1, description: '', unitCost: '', quantity: '1', price: '' }],
    notes: '',
    bankDetails: '',
    totalInWords: '',
    signatory: '',
  };
}

function createPresetSvitla(): InvoiceTemplate {
  return {
    id: generateId(),
    name: 'Svitla Systems — Melnychenko Vadym',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    invoiceNumber: '1',
    contractRef: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'USD',
    companyDetails: `Melnychenko Vadym
ITN: 01889430334
Braghieri Galleria 2, 29015 Castel San Giovanni (PC), Italy
melnicenkovadik@gmail.com`,
    billTo: `Svitla Systems, Inc.
Company №: 52-2440023
100 Meadowcreek Drive, STE 102
Corte Madera, CA 94925
USA`,
    lineItems: [{ id: generateId(), index: 1, description: 'Software development services – February 2026 (partial month)', unitCost: '1750.00', quantity: '1', price: '1750.00' }],
    notes: '',
    bankDetails: `IBAN: IT78T0623065260000031843959
Bank: Crédit Agricole Italia S.p.A.
Address: Via Università 1, 43121 Parma, Italy
SWIFT/BIC: CRPPIT2P017`,
    totalInWords: 'One thousand seven hundred fifty US dollars and 00 cents',
    signatory: 'Melnychenko Vadym',
  };
}

function createPresetCivitta(): InvoiceTemplate {
  return {
    id: generateId(),
    name: 'Civitta — Melnychenko Vadym',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    invoiceNumber: '5',
    contractRef: '',
    invoiceDate: '',
    dueDate: '',
    currency: 'EUR',
    companyDetails: `Melnychenko Vadym
ITN: 01889430334
Italy, Piacenza, Castel San Giovanni, Braghieri Galleria 2, 29015
melnicenkovadik@gmail.com`,
    billTo: `UAB "Civitta"
Company №: 302477747
Gedimino pr. 27, LT-01104 Vilnius, Lithuania
VAT: LT100005180610`,
    lineItems: [
      { id: generateId(), index: 1, description: 'Frontend development - DIG UDN FE 2026 - Udenombanken back-office frontend 2026', unitCost: '2080.00', quantity: '1', price: '2080.00' },
      { id: generateId(), index: 2, description: 'Frontend development - DIG H2 NEW - H2AUTO new version of the app', unitCost: '580.00', quantity: '1', price: '580.00' },
    ],
    notes: '',
    bankDetails: `IBAN: IT78T0623065260000031843959
Bank: CreditAgricole
Address: Via Università 1, 43121 Parma, Italy
SWIFT/BIC: CRPPIT2P017`,
    totalInWords: 'Two thousand six hundred sixty euros and 00 cents',
    signatory: 'Melnychenko Vadym',
  };
}

function createPresetRndpoint(): InvoiceTemplate {
  return {
    id: generateId(),
    name: 'RNDPOINT — Mostytsiak Serhii',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    invoiceNumber: '01/03',
    contractRef: 'SM02',
    invoiceDate: '',
    dueDate: '',
    currency: 'USD',
    companyDetails: `Private Entrepreneur Serhii Mostytsiak
ITN: 2500418735
Kyiv Region, Kyiv-Sviatoshynskyi District, Chaiky village, Valerii Lobanovskyi Street, building 26, apartment 73, Ukraine
melnychenkovad@gmail.com`,
    billTo: `RNDPOINT LTD
Company №: 12526176
128 City Road
London, United Kingdom, EC1V 2NX
VAT: GB347056301`,
    lineItems: [{ id: generateId(), index: 1, description: 'Payment for software development services', unitCost: '1000.00', quantity: '1', price: '1000.00' }],
    notes: '',
    bankDetails: `IBAN: UA853052990262026401002292423
Account: 5168745681717184
Bank: PRIVATBANK
Address: 1D Hrushevskogo Str., Kyiv, 01001, Ukraine
SWIFT/BIC: PBANUA2X
Correspondent Bank: Citibank N.A., New York, USA
Correspondent SWIFT: CITIUS33
Correspondent Account: 36445343`,
    totalInWords: 'One thousand US dollars and 00 cents',
    signatory: 'Serhii Mostytsiak',
  };
}

export type PresetKey = 'svitla' | 'civitta' | 'rndpoint';

export const PRESETS: { key: PresetKey; name: string; contractor: string; customer: string; currency: string; amount: string }[] = [
  { key: 'svitla', name: 'Svitla Systems', contractor: 'Melnychenko Vadym', customer: 'Svitla Systems, Inc.', currency: 'USD', amount: '$1,750' },
  { key: 'civitta', name: 'Civitta', contractor: 'Melnychenko Vadym', customer: 'UAB "Civitta"', currency: 'EUR', amount: '€2,660' },
  { key: 'rndpoint', name: 'RNDPOINT', contractor: 'Serhii Mostytsiak', customer: 'RNDPOINT LTD', currency: 'USD', amount: '$1,000' },
];

export function createPresetByKey(key: PresetKey): InvoiceTemplate {
  if (key === 'svitla') return createPresetSvitla();
  if (key === 'civitta') return createPresetCivitta();
  return createPresetRndpoint();
}

// --- Store ---

interface InvoiceStore {
  templates: InvoiceTemplate[];
  folders: Folder[];
  settings: AppSettings;
  savedSignatures: Record<string, string>;

  addTemplate: (name: string) => string;
  saveTemplate: (template: InvoiceTemplate) => void;
  duplicateTemplate: (id: string) => string | null;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void;
  addLineItem: (templateId: string) => void;
  updateLineItem: (templateId: string, itemId: string, updates: Partial<LineItem>) => void;
  removeLineItem: (templateId: string, itemId: string) => void;
  moveTemplateToFolder: (templateId: string, folderId: string | undefined) => void;
  addFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateEmailSettings: (email: Partial<AppSettings['email']>) => void;
  saveSignature: (name: string, dataUrl: string) => void;
  deleteSignature: (name: string) => void;
}

export const useStore = create<InvoiceStore>()(
  persist(
    (set) => ({
      templates: [],
      folders: [],
      savedSignatures: {},
      settings: {
        email: {
          resendApiKey: '',
          senderEmail: '',
          senderName: '',
        },
        defaultCurrency: 'USD',
        companyName: '',
      },

      addTemplate: (name: string) => {
        const template = createDefaultTemplate(name);
        set((state) => ({ templates: [...state.templates, template] }));
        return template.id;
      },

      saveTemplate: (template: InvoiceTemplate) => {
        set((state) => {
          const exists = state.templates.some(t => t.id === template.id);
          if (exists) {
            return {
              templates: state.templates.map(t =>
                t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t
              ),
            };
          }
          return { templates: [...state.templates, { ...template, updatedAt: new Date().toISOString() }] };
        });
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

      addLineItem: (templateId: string) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId
              ? {
                  ...t,
                  updatedAt: new Date().toISOString(),
                  lineItems: [
                    ...t.lineItems,
                    { id: generateId(), index: t.lineItems.length + 1, description: '', unitCost: '', quantity: '1', price: '' },
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

      moveTemplateToFolder: (templateId: string, folderId: string | undefined) => {
        set((state) => ({
          templates: state.templates.map(t =>
            t.id === templateId ? { ...t, folderId, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      addFolder: (name: string) => {
        const id = generateId();
        set((state) => ({
          folders: [...state.folders, { id, name, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      renameFolder: (id: string, name: string) => {
        set((state) => ({
          folders: state.folders.map(f => (f.id === id ? { ...f, name } : f)),
        }));
      },

      deleteFolder: (id: string) => {
        set((state) => ({
          folders: state.folders.filter(f => f.id !== id),
          templates: state.templates.map(t =>
            t.folderId === id ? { ...t, folderId: undefined } : t
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

      saveSignature: (name: string, dataUrl: string) => {
        set((state) => ({
          savedSignatures: { ...state.savedSignatures, [name]: dataUrl },
        }));
      },

      deleteSignature: (name: string) => {
        set((state) => {
          const { [name]: _, ...rest } = state.savedSignatures;
          return { savedSignatures: rest };
        });
      },
    }),
    {
      name: 'invoice-generator-storage-v4',
      storage: createJSONStorage(() => apiStorage),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<InvoiceStore>;
        const templates = (p.templates ?? []).map(t => ({
          ...t,
          lineItems: t.lineItems.map(li => ({
            ...li,
            unitCost: li.unitCost ?? li.price ?? '',
            quantity: li.quantity ?? '1',
          })),
        }));
        return { ...current, ...p, folders: p.folders ?? [], savedSignatures: p.savedSignatures ?? {}, templates };
      },
    }
  )
);
