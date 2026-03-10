export interface LineItem {
  id: string;
  index: number;
  description: string;
  unitCost: string;
  quantity: string;
  price: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  contractRef: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  companyDetails: string;
  billTo: string;
  lineItems: LineItem[];
  notes: string;
  bankDetails: string;
  totalInWords: string;
  signatory: string;
  signatureImage?: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export interface EmailSettings {
  resendApiKey: string;
  senderEmail: string;
  senderName: string;
}

export interface AppSettings {
  email: EmailSettings;
  defaultCurrency: string;
  companyName: string;
}
