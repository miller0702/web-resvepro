import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Megaphone,
  Menu,
  Smartphone,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { AppSectionsTab } from './AppSectionsTab';
import { AppDrawerPage } from './AppDrawerPage';
import { AnnouncementsPage } from './AnnouncementsPage';
import { ManualPage } from './ManualPage';
import { TutorialPage } from './TutorialPage';

export type AppMobileTab = 'sections' | 'drawer' | 'announcements' | 'manual' | 'tutorial';

const TABS: { id: AppMobileTab; label: string; icon: typeof Smartphone }[] = [
  { id: 'sections', label: 'Pestañas', icon: LayoutGrid },
  { id: 'drawer', label: 'Menú lateral', icon: Menu },
  { id: 'announcements', label: 'Anuncios @resvepro', icon: Megaphone },
  { id: 'manual', label: 'Manual', icon: BookOpen },
  { id: 'tutorial', label: 'Tutorial', icon: GraduationCap },
];

export function parseAppMobileTab(value: string | null): AppMobileTab {
  if (value && TABS.some((t) => t.id === value)) {
    return value as AppMobileTab;
  }
  return 'sections';
}

export function AppPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseAppMobileTab(searchParams.get('tab'));

  const setTab = (next: AppMobileTab) => {
    if (next === 'sections') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: next });
    }
  };

  return (
    <div>
      <PageHeader
        title="App móvil"
        subtitle="Pestañas, menú lateral, anuncios oficiales, manual y tutorial de bienvenida."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === item.id
                  ? 'bg-gold/15 text-gold-dim dark:text-gold-light'
                  : 'surface-muted text-theme-secondary hover:opacity-90'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'sections' && <AppSectionsTab />}
      {tab === 'drawer' && <AppDrawerPage embedded />}
      {tab === 'announcements' && <AnnouncementsPage embedded />}
      {tab === 'manual' && <ManualPage embedded />}
      {tab === 'tutorial' && <TutorialPage embedded />}
    </div>
  );
}
