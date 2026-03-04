export interface InvoiceField {
  id: string;
  key: string;
  label: string;
  value: string;
  type: 'text' | 'textarea' | 'number';
  group: 'contractor' | 'bank' | 'customer' | 'items' | 'meta' | 'custom';
  isCustom?: boolean;
}

export interface LineItem {
  id: string;
  index: number;
  description: string;
  price: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  fields: InvoiceField[];
  lineItems: LineItem[];
  totalInWords: string;
  signatory: string;
  currency: string;
}

export interface EmailSettings {
  senderEmail: string;
  senderName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  useTLS: boolean;
}

export interface AppSettings {
  email: EmailSettings;
  defaultCurrency: string;
  companyName: string;
}
