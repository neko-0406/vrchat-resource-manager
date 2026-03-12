import { ReactNode } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../ui/sidebar';
import { LucideIcon, Shirt, PackagePlus, Settings } from 'lucide-react';

export interface MenuItem {
  title: string,
  url: string,
  icon: LucideIcon
}

const menuItems: MenuItem[] = [
  {
    title: "アセット",
    url: "/",
    icon: Shirt
  },
  {
    title: "登録",
    url: "/register",
    icon: PackagePlus
  },
  {
    title: "設定",
    url: "/setting",
    icon: Settings
  }
]

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
              menuItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            }
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
