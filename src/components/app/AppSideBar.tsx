import { ReactNode } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, useSidebar } from '../ui/sidebar';

export default function AppSideBar(): ReactNode {
  
  const { setOpen } = useSidebar();
  
  return (
    <Sidebar
      variant='sidebar'
      side='left'
      collapsible='icon'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader>Index</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {
              
            }
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
