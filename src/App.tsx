import { BrowserRouter } from 'react-router';
import './App.css';
import { Routes } from 'react-router';
import { Route } from 'react-router';
import AppLayout from './layout/AppLayout';
import AssetPage from './page/AssetPage';
import AssetRegisterPage from './page/AssetRegisterPage';
import AppSettingPage from './page/AppSettingPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<AppLayout />}>
          <Route path='assets' element={<AssetPage />} />
          <Route path='register' element={<AssetRegisterPage />} />
          <Route path='setting' element={<AppSettingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
