import { Suspense, lazy } from 'react';
import { HashRouter, Outlet, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { AuthProvider } from '../auth/AuthProvider';
import { AuthGate } from '../components/auth/AuthGate';

const StudentPage = lazy(async () => {
  const module = await import('../pages/StudentPage');
  return { default: module.StudentPage };
});

const AdminPage = lazy(async () => {
  const module = await import('../pages/AdminPage');
  return { default: module.AdminPage };
});

const DisplayPage = lazy(async () => {
  const module = await import('../pages/DisplayPage');
  return { default: module.DisplayPage };
});

const PlannerPage = lazy(async () => {
  const module = await import('../pages/PlannerPage');
  return { default: module.PlannerPage };
});

const LessonTemplateLibraryPage = lazy(async () => {
  const module = await import('../pages/LessonTemplateLibraryPage');
  return { default: module.LessonTemplateLibraryPage };
});

const LessonTemplateBuilderPage = lazy(async () => {
  const module = await import('../pages/LessonTemplateBuilderPage');
  return { default: module.LessonTemplateBuilderPage };
});

const NewLessonSessionPage = lazy(async () => {
  const module = await import('../pages/NewLessonSessionPage');
  return { default: module.NewLessonSessionPage };
});

const SessionsDashboardPage = lazy(async () => {
  const module = await import('../pages/SessionsDashboardPage');
  return { default: module.SessionsDashboardPage };
});

const CustomQuestionSessionPage = lazy(async () => {
  const module = await import('../pages/CustomQuestionSessionPage');
  return { default: module.CustomQuestionSessionPage };
});

const NotFoundPage = lazy(async () => {
  const module = await import('../pages/NotFoundPage');
  return { default: module.NotFoundPage };
});

// Wraps every presenter route in the DoroGate auth gate. /student stays outside
// this layout so students keep their anonymous-auth participation flow.
function PresenterLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Outlet />
      </AuthGate>
    </AuthProvider>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="route-loading">Loading DORO Live Survey...</div>}>
        <Routes>
          <Route path="/student" element={<StudentPage />} />
          <Route element={<PresenterLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/sessions" element={<SessionsDashboardPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/library" element={<LessonTemplateLibraryPage />} />
            <Route path="/builder" element={<LessonTemplateBuilderPage />} />
            <Route path="/builder/:templateId" element={<LessonTemplateBuilderPage />} />
            <Route path="/session-new" element={<NewLessonSessionPage />} />
            <Route path="/custom-session" element={<CustomQuestionSessionPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/display" element={<DisplayPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
