import { useStore } from '../store/useStore';
import { Mail, Shield } from 'lucide-react';

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const updateEmailSettings = useStore((s) => s.updateEmailSettings);

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
            <p className="text-xs text-text-tertiary">Configure SMTP to send invoices via email</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Sender Name</label>
            <input
              type="text"
              value={settings.email.senderName}
              onChange={(e) => updateEmailSettings({ senderName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Sender Email</label>
            <input
              type="email"
              value={settings.email.senderEmail}
              onChange={(e) => updateEmailSettings({ senderEmail: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">SMTP Host</label>
            <input
              type="text"
              value={settings.email.smtpHost}
              onChange={(e) => updateEmailSettings({ smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">SMTP Port</label>
            <input
              type="number"
              value={settings.email.smtpPort}
              onChange={(e) => updateEmailSettings({ smtpPort: parseInt(e.target.value) || 587 })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">SMTP Username</label>
            <input
              type="text"
              value={settings.email.smtpUser}
              onChange={(e) => updateEmailSettings({ smtpUser: e.target.value })}
              placeholder="your-email@gmail.com"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">SMTP Password</label>
            <input
              type="password"
              value={settings.email.smtpPassword}
              onChange={(e) => updateEmailSettings({ smtpPassword: e.target.value })}
              placeholder="App password"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-secondary text-sm
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="useTLS"
            checked={settings.email.useTLS}
            onChange={(e) => updateEmailSettings({ useTLS: e.target.checked })}
            className="rounded accent-accent"
          />
          <label htmlFor="useTLS" className="text-sm text-text-secondary flex items-center gap-1.5">
            <Shield size={14} />
            Use TLS encryption
          </label>
        </div>
      </section>

      <section className="bg-surface rounded-xl border border-border p-6">
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
    </div>
  );
}
