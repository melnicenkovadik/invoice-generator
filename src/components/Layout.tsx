import { NavLink, Outlet } from 'react-router-dom';
import { FileText, Settings, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export function Layout() {
  const addTemplate = useStore((s) => s.addTemplate);
  const navigate = useNavigate();

  const handleNew = () => {
    const id = addTemplate('New Invoice');
    navigate(`/editor/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between shadow-sm">
        <NavLink to="/" className="flex items-center gap-2.5 no-underline">
          <FileText size={22} className="text-accent" />
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            Invoice Creator
          </span>
        </NavLink>
        <nav className="flex items-center gap-1">
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              bg-accent text-text-inverse hover:bg-accent-hover transition-colors cursor-pointer border-none"
          >
            <Plus size={16} />
            New Invoice
          </button>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors
              ${isActive ? 'bg-neutral-100 text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-neutral-50'}`
            }
          >
            <Settings size={16} />
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
