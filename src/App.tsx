import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import './App.css';
import AppLayout from './layout/AppLayout';
import AssetPage from './page/AssetPage';
import AssetRegisterPage from './page/AssetRegisterPage';
import AppSettingPage from './page/AppSettingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<AppLayout />}>
          <Route index element={<Navigate to="/assets" replace />} />
          <Route path='assets' element={<AssetPage />} />
          <Route path='register' element={<AssetRegisterPage />} />
          <Route path='setting' element={<AppSettingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
