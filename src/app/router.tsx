import { Suspense, lazy } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';
import { AuthGate } from '../components/auth/AuthGate';
import { AppHeader } from '../components/layout/AppHeader';

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

// 구 경로 /builder/:templateId → /custom-template/:templateId 로 파라미터 보존 리다이렉트.
function RedirectBuilderToCustomTemplate() {
  const { templateId } = useParams();
  return <Navigate to={`/custom-template/${templateId ?? ''}`} replace />;
}

// Wraps every presenter route in the DoroGate auth gate. /student stays outside
// this layout so students keep their anonymous-auth participation flow.
function PresenterLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <div className="app-frame">
          <AppHeader />
          <Outlet />
        </div>
      </AuthGate>
    </AuthProvider>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/student" element={<StudentPage />} />
          <Route element={<PresenterLayout />}>
            {/* 홈은 별도 마케팅 랜딩 없이 '내 수업' 대시보드로 진입한다. */}
            <Route path="/" element={<Navigate to="/sessions" replace />} />
            <Route path="/sessions" element={<SessionsDashboardPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/templates" element={<LessonTemplateLibraryPage />} />
            <Route path="/custom-template" element={<LessonTemplateBuilderPage />} />
            <Route path="/custom-template/:templateId" element={<LessonTemplateBuilderPage />} />
            {/* 구 경로 호환 리다이렉트 */}
            <Route path="/template" element={<Navigate to="/templates" replace />} />
            <Route path="/library" element={<Navigate to="/templates" replace />} />
            <Route path="/builder" element={<Navigate to="/custom-template" replace />} />
            <Route path="/builder/:templateId" element={<RedirectBuilderToCustomTemplate />} />
            <Route path="/session-new" element={<NewLessonSessionPage />} />
            <Route path="/custom-session" element={<CustomQuestionSessionPage />} />
            <Route path="/custom-session/:sessionId" element={<CustomQuestionSessionPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/display" element={<DisplayPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
