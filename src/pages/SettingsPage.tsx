import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { Mail, Download, Upload } from 'lucide-react';

const STORAGE_KEY = 'invoice-generator-storage-v4';

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const updateEmailSettings = useStore((s) => s.updateEmailSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm ' +
    'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors';

  const handleExport = async () => {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      try {
        const res = await fetch('/api/data');
        if (res.ok) raw = await res.text();
      } catch { /* ignore */ }
    }
    if (!raw || raw === 'null') { alert('Nothing to export'); return; }
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-generator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.state || !parsed.state.templates) {
          alert('Invalid backup file format.');
          return;
        }
        localStorage.setItem(STORAGE_KEY, text);
        try {
          await fetch('/api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: text });
        } catch { /* API unavailable */ }
        window.location.reload();
      } catch {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Settings</h1>

      <section className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Mail size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="font-medium text-sm">Email Configuration</h2>
            <p className="text-xs text-text-tertiary">Send invoices via Resend</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Resend API Key</label>
            <input
              type="password"
              value={settings.email.resendApiKey}
              onChange={(e) => updateEmailSettings({ resendApiKey: e.target.value })}
              placeholder="re_xxxxxxxxx"
              className={inputCls}
            />
            <p className="text-xs text-text-tertiary mt-1.5">
              Get your API key at{' '}
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                resend.com/api-keys
              </a>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sender Name</label>
              <input
                type="text"
                value={settings.email.senderName}
                onChange={(e) => updateEmailSettings({ senderName: e.target.value })}
                placeholder="John Doe"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sender Email</label>
              <input
                type="email"
                value={settings.email.senderEmail}
                onChange={(e) => updateEmailSettings({ senderEmail: e.target.value })}
                placeholder="invoices@yourdomain.com"
                className={inputCls}
              />
              <p className="text-xs text-text-tertiary mt-1.5">
                Must be from a domain verified in Resend, or use onboarding@resend.dev for testing
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border p-6 mb-6">
        <h2 className="font-medium text-sm mb-4">General</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => updateSettings({ companyName: e.target.value })}
              placeholder="Your Company"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Default Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => updateSettings({ defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="UAH">UAH - Ukrainian Hryvnia</option>
              <option value="PLN">PLN - Polish Zloty</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className="font-medium text-sm mb-1">Data</h2>
        <p className="text-xs text-text-tertiary mb-4">
          Export all invoices, templates, signatures, folders, and settings as a single JSON file.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              border border-border text-text-secondary hover:text-text-primary hover:bg-neutral-50
              transition-colors cursor-pointer bg-transparent"
          >
            <Download size={15} />
            Export backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              border border-border text-text-secondary hover:text-text-primary hover:bg-neutral-50
              transition-colors cursor-pointer bg-transparent"
          >
            <Upload size={15} />
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </section>
    </div>
  );
}
