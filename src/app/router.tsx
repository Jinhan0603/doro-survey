import { Suspense, lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

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

const NotFoundPage = lazy(async () => {
  const module = await import('../pages/NotFoundPage');
  return { default: module.NotFoundPage };
});

export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="route-loading">Loading DORO Live Survey...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/library" element={<LessonTemplateLibraryPage />} />
          <Route path="/builder" element={<LessonTemplateBuilderPage />} />
          <Route path="/builder/:templateId" element={<LessonTemplateBuilderPage />} />
          <Route path="/session-new" element={<NewLessonSessionPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
