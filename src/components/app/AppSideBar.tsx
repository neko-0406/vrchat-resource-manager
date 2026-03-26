import { ReactNode, useMemo } from 'react';
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
import { NavLink, useLocation } from 'react-router';

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
  const location = useLocation();

  // 現在のパスに一致するメニューアイテムを検索
  const activeItem = useMemo(() => {
    return menuItems.find((item) => location.pathname.includes(item.url)) || menuItems[0];
  }, [location.pathname]);

  const HeaderIcon = activeItem.icon;

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
            <SidebarMenuButton size='lg'>
              {/*現在の項目に応じたアイコンを表示*/}
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <HeaderIcon className='size-4' />
              </div>
              {
                // 開閉状態に応じて表示・非表示切り替え
                open && (
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>VRChat</span>
                    <span className='truncate text-xs'>Resource-Manager</span>
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
                <NavLink to={item.url}>
                  {({ isActive }) => (
                    <SidebarMenuButton tooltip={item.title} isActive={isActive} className='py-6'>
                      <item.icon className='size-6!' />
                      <span className='text-base font-medium'>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
