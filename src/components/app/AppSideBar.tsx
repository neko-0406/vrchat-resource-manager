import { ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';
import { LucideIcon, Shirt, PackagePlus, Settings } from 'lucide-react';

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

const menuItems: MenuItem[] = [
  {
    title: 'アセット一覧',
    url: 'assets',
    icon: Shirt,
  },
  {
    title: 'アセット登録',
    url: 'register',
    icon: PackagePlus,
  },
  {
    title: 'アプリ設定',
    url: 'setting',
    icon: Settings,
  },
];

export default function AppSideBar(): ReactNode {
  const { setOpen, open } = useSidebar();

  return (
    <Sidebar
      variant='sidebar'
      side='left'
      collapsible='icon'
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              {/*アプリアイコン*/}
              <div></div>
              {
                // 開閉状態に応じて表示・非表示切り替え
                open && (
                  <div>
                    <span>
                      VRChat
                      <br />
                      Resource-Manager
                    </span>
                  </div>
                )
              }
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a href={item.url} className='py-6'>
                    <item.icon className='size-6!' />
                    <span className='text-base font-medium'>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
