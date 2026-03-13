import { Outlet } from 'react-router';
import '../App.css';
import AppSideBar from '../components/app/AppSideBar';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';

export default function AppLayout() {
  return (
    <SidebarProvider defaultOpen={false} >
      <AppSideBar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}