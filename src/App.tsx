import './App.css';
import AppSideBar from './components/app/AppSideBar';
import { SidebarProvider } from './components/ui/sidebar';

export default function App() {
  return (
    <SidebarProvider defaultOpen={false} >
      <AppSideBar />
    </SidebarProvider>
  );
}
