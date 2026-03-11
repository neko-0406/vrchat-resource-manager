import './App.css';
import AppSideBar from './components/app/AppSideBar';
import { SidebarProvider, useSidebar } from './components/ui/sidebar';

export default function App() {
  // const { state, setOpen } = useSidebar();
  return (
    <SidebarProvider defaultOpen={true} >
      <AppSideBar />
    </SidebarProvider>
  );
}
