import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { FileText, Copy, Trash2, Plus, Clock } from 'lucide-react';

export function Dashboard() {
  const templates = useStore((s) => s.templates);
  const addTemplate = useStore((s) => s.addTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const duplicateTemplate = useStore((s) => s.duplicateTemplate);
  const navigate = useNavigate();

  const handleNew = () => {
    const id = addTemplate('New Invoice');
    navigate(`/editor/${id}`);
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newId = duplicateTemplate(id);
    if (newId) navigate(`/editor/${newId}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this invoice template?')) {
      deleteTemplate(id);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
            bg-primary text-text-inverse hover:bg-primary-hover transition-colors cursor-pointer border-none"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
          <h2 className="text-lg font-medium text-text-secondary mb-1">No invoices yet</h2>
          <p className="text-sm text-text-tertiary mb-6">
            Create your first invoice template to get started
          </p>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              bg-accent text-text-inverse hover:bg-accent-hover transition-colors cursor-pointer border-none"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/editor/${t.id}`)}
              className="bg-surface rounded-xl border border-border p-5 cursor-pointer
                hover:shadow-lg hover:border-border-hover transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileText size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm leading-tight">{t.name}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {t.fields.find(f => f.key === 'invoiceNumber')?.value || 'No number'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDuplicate(e, t.id)}
                    className="p-1.5 rounded-md hover:bg-neutral-100 text-text-tertiary hover:text-text-primary
                      transition-colors cursor-pointer bg-transparent border-none"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, t.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-text-tertiary hover:text-danger
                      transition-colors cursor-pointer bg-transparent border-none"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <Clock size={12} />
                Updated {formatDate(t.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
