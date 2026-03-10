import { useState } from 'react';
import { useStore } from '../store/useStore';
import { PRESETS } from '../store/useStore';
import type { PresetKey } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Copy, Trash2, Plus, Clock, Zap, X, ArrowRight,
  FolderPlus, Folder, FolderOpen, Pencil, Check, ChevronRight, MoveRight,
} from 'lucide-react';

function PresetModal({ onClose, onSelect }: { onClose: () => void; onSelect: (key: PresetKey) => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-base">Choose a preset</h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Create a new invoice based on an existing template
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-text-tertiary hover:text-text-primary
              transition-colors cursor-pointer bg-transparent border-none"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              onClick={() => onSelect(preset.key)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-border
                bg-surface hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText size={17} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {preset.contractor} → {preset.customer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-secondary">
                  {preset.amount} <span className="text-text-tertiary font-normal">{preset.currency}</span>
                </span>
                <ArrowRight
                  size={15}
                  className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          <p className="text-xs text-text-tertiary text-center">
            The preset will open as a new editable invoice — save it when ready
          </p>
        </div>
      </div>
    </div>
  );
}

function MoveToFolderModal({
  templateId,
  currentFolderId,
  onClose,
}: {
  templateId: string;
  currentFolderId?: string;
  onClose: () => void;
}) {
  const folders = useStore((s) => s.folders);
  const moveTemplateToFolder = useStore((s) => s.moveTemplateToFolder);

  const handleMove = (folderId: string | undefined) => {
    moveTemplateToFolder(templateId, folderId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-xs p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-medium text-sm mb-3">Move to folder</h3>
        <div className="space-y-1">
          <button
            onClick={() => handleMove(undefined)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left cursor-pointer
              border-none transition-colors ${!currentFolderId ? 'bg-accent/10 text-accent' : 'bg-transparent hover:bg-neutral-100 text-text-secondary'}`}
          >
            <FileText size={14} />
            No folder
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => handleMove(folder.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left cursor-pointer
                border-none transition-colors ${currentFolderId === folder.id ? 'bg-accent/10 text-accent' : 'bg-transparent hover:bg-neutral-100 text-text-secondary'}`}
            >
              <Folder size={14} />
              {folder.name}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full py-1.5 rounded-lg text-xs text-text-tertiary hover:bg-neutral-100
            transition-colors cursor-pointer bg-transparent border-none"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const templates = useStore((s) => s.templates);
  const folders = useStore((s) => s.folders);
  const addTemplate = useStore((s) => s.addTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const duplicateTemplate = useStore((s) => s.duplicateTemplate);
  const addFolder = useStore((s) => s.addFolder);
  const renameFolder = useStore((s) => s.renameFolder);
  const deleteFolder = useStore((s) => s.deleteFolder);
  const navigate = useNavigate();

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null); // null = all, 'none' = unfiled
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [moveTemplateId, setMoveTemplateId] = useState<string | null>(null);

  const folderParam = activeFolder && activeFolder !== 'none' ? `&folder=${activeFolder}` : '';

  const handleNew = () => {
    navigate(`/editor/new?${folderParam}`);
  };

  const handleSelectPreset = (key: PresetKey) => {
    setShowPresetModal(false);
    navigate(`/editor/new?preset=${key}${folderParam}`);
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

  const handleMove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMoveTemplateId(id);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim());
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const handleSaveRenameFolder = (id: string) => {
    if (editingFolderName.trim()) {
      renameFolder(id, editingFolderName.trim());
    }
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm('Delete this folder? Templates inside will be moved out.')) {
      if (activeFolder === id) setActiveFolder(null);
      deleteFolder(id);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter templates by active folder
  const filteredTemplates = activeFolder === null
    ? templates
    : activeFolder === 'none'
      ? templates.filter(t => !t.folderId)
      : templates.filter(t => t.folderId === activeFolder);

  const unfiledCount = templates.filter(t => !t.folderId).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPresetModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              bg-surface border border-border text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <Zap size={16} className="text-accent" />
            Use Preset
          </button>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
              bg-primary text-text-inverse hover:bg-primary-hover transition-colors cursor-pointer border-none"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Folder bar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setActiveFolder(null)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors cursor-pointer border-none ${
              activeFolder === null
                ? 'bg-accent/10 text-accent'
                : 'bg-transparent text-text-secondary hover:bg-neutral-100'
            }`}
        >
          All
          <span className="text-xs opacity-60">{templates.length}</span>
        </button>

        <button
          onClick={() => setActiveFolder('none')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors cursor-pointer border-none ${
              activeFolder === 'none'
                ? 'bg-accent/10 text-accent'
                : 'bg-transparent text-text-secondary hover:bg-neutral-100'
            }`}
        >
          <FileText size={14} />
          Unfiled
          <span className="text-xs opacity-60">{unfiledCount}</span>
        </button>

        {folders.map((folder) => {
          const count = templates.filter(t => t.folderId === folder.id).length;
          const isEditing = editingFolderId === folder.id;
          const isActive = activeFolder === folder.id;

          return (
            <div key={folder.id} className="relative group flex items-center">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRenameFolder(folder.id);
                      if (e.key === 'Escape') setEditingFolderId(null);
                    }}
                    className="px-2 py-1 rounded-md border border-accent bg-surface text-sm w-28 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveRenameFolder(folder.id)}
                    className="p-1 rounded text-accent hover:bg-accent/10 cursor-pointer bg-transparent border-none"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveFolder(folder.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-colors cursor-pointer border-none ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'bg-transparent text-text-secondary hover:bg-neutral-100'
                    }`}
                >
                  {isActive ? <FolderOpen size={14} /> : <Folder size={14} />}
                  {folder.name}
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              )}

              {!isEditing && (
                <div className="hidden group-hover:flex items-center ml-0.5 gap-0.5">
                  <button
                    onClick={() => {
                      setEditingFolderId(folder.id);
                      setEditingFolderName(folder.name);
                    }}
                    className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-neutral-100
                      cursor-pointer bg-transparent border-none"
                    title="Rename"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 rounded text-text-tertiary hover:text-danger hover:bg-red-50
                      cursor-pointer bg-transparent border-none"
                    title="Delete folder"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {creatingFolder ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
              }}
              placeholder="Folder name"
              className="px-2 py-1 rounded-md border border-accent bg-surface text-sm w-28 focus:outline-none"
            />
            <button
              onClick={handleCreateFolder}
              className="p-1 rounded text-accent hover:bg-accent/10 cursor-pointer bg-transparent border-none"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}
              className="p-1 rounded text-text-tertiary hover:bg-neutral-100 cursor-pointer bg-transparent border-none"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-text-tertiary
              hover:text-accent hover:bg-neutral-100 transition-colors cursor-pointer bg-transparent border-none"
            title="New folder"
          >
            <FolderPlus size={14} />
          </button>
        )}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
          <h2 className="text-lg font-medium text-text-secondary mb-1">
            {activeFolder !== null ? 'No invoices in this folder' : 'No invoices yet'}
          </h2>
          <p className="text-sm text-text-tertiary mb-6">
            {activeFolder !== null
              ? 'Move invoices here or create a new one'
              : 'Create your first invoice template to get started'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowPresetModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                bg-surface border border-border text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Zap size={16} className="text-accent" />
              Use Preset
            </button>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                bg-accent text-text-inverse hover:bg-accent-hover transition-colors cursor-pointer border-none"
            >
              <Plus size={16} />
              Create Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => {
            const folder = folders.find(f => f.id === t.folderId);
            return (
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
                        {t.invoiceNumber || 'No number'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {folders.length > 0 && (
                      <button
                        onClick={(e) => handleMove(e, t.id)}
                        className="p-1.5 rounded-md hover:bg-neutral-100 text-text-tertiary hover:text-text-primary
                          transition-colors cursor-pointer bg-transparent border-none"
                        title="Move to folder"
                      >
                        <MoveRight size={14} />
                      </button>
                    )}
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
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    Updated {formatDate(t.updatedAt)}
                  </div>
                  {folder && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 text-text-tertiary">
                      <Folder size={10} />
                      {folder.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPresetModal && (
        <PresetModal
          onClose={() => setShowPresetModal(false)}
          onSelect={handleSelectPreset}
        />
      )}

      {moveTemplateId && (
        <MoveToFolderModal
          templateId={moveTemplateId}
          currentFolderId={templates.find(t => t.id === moveTemplateId)?.folderId}
          onClose={() => setMoveTemplateId(null)}
        />
      )}
    </div>
  );
}
