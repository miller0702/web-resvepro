import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { BooksListPage } from './pages/books/BooksList';
import { BookFormPage } from './pages/books/BookForm';
import { BookEditPage } from './pages/books/BookEdit';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryFormPage } from './pages/categories/CategoryForm';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionFormPage } from './pages/collections/CollectionForm';
import { AuthorsPage } from './pages/AuthorsPage';
import { AuthorFormPage } from './pages/authors/AuthorForm';
import { PodcastsListPage } from './pages/podcasts/PodcastsList';
import { PodcastEditPage } from './pages/podcasts/PodcastEdit';
import { VideosListPage } from './pages/videos/VideosList';
import { VideoFormPage } from './pages/videos/VideoForm';
import { RadioListPage } from './pages/radio/RadioList';
import { RadioFormPage } from './pages/radio/RadioForm';
import { UsersPage } from './pages/UsersPage';
import { UserFormPage } from './pages/users/UserForm';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { RolesPage } from './pages/RolesPage';
import { RoleFormPage } from './pages/roles/RoleForm';
import { RequirementsPage } from './pages/RequirementsPage';
import { ModerationReportsPage } from './pages/ModerationReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppPage } from './pages/app/AppPage';
import { AppSectionEditPage } from './pages/app/AppSectionEditPage';
import { ManualEditPage } from './pages/app/ManualEditPage';
import { TutorialEditPage } from './pages/app/TutorialEditPage';
import { LegalPublicPage } from './pages/legal/LegalPublicPage';
import { AccountDeletionPage } from './pages/legal/AccountDeletionPage';
import { HelpManualPage } from './pages/HelpManualPage';
import { StorageGuidePage } from './pages/StorageGuidePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/legal/:slug" element={<LegalPublicPage />} />
      <Route path="/account-deletion" element={<AccountDeletionPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="books" element={<BooksListPage />} />
        <Route path="books/new" element={<BookFormPage />} />
        <Route path="books/:id" element={<BookEditPage />} />
        <Route path="authors" element={<AuthorsPage />} />
        <Route path="authors/new" element={<AuthorFormPage />} />
        <Route path="authors/:id" element={<AuthorFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/new" element={<CategoryFormPage />} />
        <Route path="categories/:id" element={<CategoryFormPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="collections/new" element={<CollectionFormPage />} />
        <Route path="collections/:id" element={<CollectionFormPage />} />
        <Route path="podcasts" element={<PodcastsListPage />} />
        <Route path="podcasts/:id" element={<PodcastEditPage />} />
        <Route path="videos" element={<VideosListPage />} />
        <Route path="videos/:id" element={<VideoFormPage />} />
        <Route path="radio" element={<RadioListPage />} />
        <Route path="radio/:id" element={<RadioFormPage />} />
        <Route path="storage" element={<StorageGuidePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<UserFormPage />} />
        <Route path="users/:id/edit" element={<UserFormPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="roles/new" element={<RoleFormPage />} />
        <Route path="roles/:id/edit" element={<RoleFormPage />} />
        <Route path="requirements" element={<RequirementsPage />} />
        <Route path="moderation" element={<ModerationReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpManualPage />} />
        <Route path="app" element={<AppPage />} />
        <Route path="app/manual/:code" element={<ManualEditPage />} />
        <Route path="app/tutorial/:code" element={<TutorialEditPage />} />
        <Route path="app/drawer" element={<Navigate to="/app?tab=drawer" replace />} />
        <Route path="app/announcements" element={<Navigate to="/app?tab=announcements" replace />} />
        <Route path="app/manual" element={<Navigate to="/app?tab=manual" replace />} />
        <Route path="app/tutorial" element={<Navigate to="/app?tab=tutorial" replace />} />
        <Route path="app/:code" element={<AppSectionEditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
