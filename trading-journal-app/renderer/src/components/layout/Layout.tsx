import { Outlet } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";

const navLinks = [
  {
    to: "/",
    label: "Dashboard",
    description: "Vista general",
  },
  {
    to: "/mt5dashboard",
    label: "Dashboard MT5",
    description: "Análisis de datos MT5",
  },
  {
    to: "/trades",
    label: "Trade Log",
    description: "Historial de operaciones",
  },
  {
    to: "/accounts",
    label: "Cuentas",
    description: "Cuentas de trading",
  },
  {
    to: "/strategies",
    label: "Estrategias",
    description: "Metodologías de trading",
  },
  {
    to: "/plans",
    label: "Planes",
    description: "Planes de trading",
  },
  {
    to: "/settings",
    label: "Configuración",
    description: "Ajustes y preferencias",
  },
  {
    to: "/mt5import",
    label: "Importar MT5",
    description: "Importar datos desde MetaTrader 5",
  },
];

const Layout: React.FC = () => {
  const location = useLocation();

  const getCurrentPageInfo = () => {
    const currentLink = navLinks.find((link) => link.to === location.pathname);
    return (
      currentLink || {
        label: "Bitácora Trading",
        description: "Panel de Control",
      }
    );
  };

  const currentPage = getCurrentPageInfo();
  const isHomePage = location.pathname === "/";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "13rem",
          "--sidebar-width-mobile": "14rem",
        } as React.CSSProperties
      }>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-8 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='flex items-center gap-2 px-4 flex-1'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                {!isHomePage && (
                  <>
                    <BreadcrumbItem className='hidden md:block'>
                      <BreadcrumbLink href='/' className='text-sm'>
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className='hidden md:block' />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage className='text-sm font-medium'>
                    {currentPage.label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className='flex items-center gap-2 px-4'>
            <ThemeToggle />
          </div>
        </header>
        <main className='flex-1 overflow-auto'>
          <div className='h-full w-full px-2 py-2'>
            <Toaster position='top-right' richColors />
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
