import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronUp,
  Home,
  LogOut,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import avatar from "@/assets/avataaars.svg";

// Navigation items
const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Vista general",
  },
  {
    title: "Trade Log",
    url: "/trades",
    icon: TrendingUp,
    description: "Historial de operaciones",
  },
  {
    title: "Cuentas",
    url: "/accounts",
    icon: Wallet,
    description: "Cuentas de trading",
  },
  {
    title: "Estrategias",
    url: "/strategies",
    icon: Target,
    description: "Metodologías de trading",
  },
];

const settingsItems = [
  {
    title: "Configuración",
    url: "/settings",
    icon: SettingsIcon,
    description: "Ajustes y preferencias",
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar variant='inset' collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link to='/'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <TrendingUp className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    Bitácora Trading
                  </span>
                  <span className='truncate text-xs'>Trading Journal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className='size-4' />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className='size-4' />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage src={avatar} alt='Usuario' />
                    <AvatarFallback className='rounded-lg'>U</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>Usuario</span>
                    <span className='truncate text-xs'>trader@ejemplo.com</span>
                  </div>
                  <ChevronUp className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-popper-anchor-width] min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}>
                <DropdownMenuItem asChild>
                  <Link to='/settings' className='cursor-pointer'>
                    <SettingsIcon className='w-4 h-4 mr-2' />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='cursor-pointer text-red-600 focus:text-red-600'>
                  <LogOut className='w-4 h-4 mr-2' />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
