import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  Settings as SettingsIcon,
  Wallet,
  TrendingUp,
  Home,
  Target,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import avatar from "@/assets/avataaars.svg";

const navLinks = [
  {
    to: "/",
    label: "Dashboard",
    icon: <Home className='w-4 h-4' />,
    description: "Vista general",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    to: "/trades",
    label: "Trade Log",
    icon: <TrendingUp className='w-4 h-4' />,
    description: "Historial de operaciones",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    to: "/accounts",
    label: "Cuentas",
    icon: <Wallet className='w-4 h-4' />,
    description: "Cuentas de trading",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    to: "/strategies",
    label: "Estrategias",
    icon: <Target className='w-4 h-4' />,
    description: "Metodologías de trading",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    to: "/settings",
    label: "Configuración",
    icon: <SettingsIcon className='w-4 h-4' />,
    description: "Ajustes y preferencias",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
  {
    to: "/mt5import",
    label: "Importar MT5",
    icon: <TrendingUp className='w-4 h-4' />,
    description: "Importar datos desde MetaTrader 5",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
];

const Layout: React.FC = () => {
  const location = useLocation();

  const getCurrentPageTitle = () => {
    const currentLink = navLinks.find((link) => link.to === location.pathname);
    return currentLink ? currentLink.label : "Bitácora Trading";
  };

  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      {/* Header moderno con gradiente */}
      <header className='bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-lg sticky top-0 z-40 border-b border-slate-700'>
        <div className='container mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            {/* Mobile menu button */}
            <div className='flex items-center gap-3 md:hidden'>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-white hover:bg-white/10'
                    aria-label='Abrir menú'>
                    <Menu className='w-5 h-5' />
                  </Button>
                </SheetTrigger>
                <SheetContent side='left' className='w-72 p-0 bg-white'>
                  <div className='bg-gradient-to-b from-blue-600 to-blue-700 p-6 text-white'>
                    <h2 className='text-xl font-bold flex items-center gap-2'>
                      <TrendingUp className='w-6 h-6' />
                      Bitácora Trading
                    </h2>
                    <p className='text-blue-100 text-sm mt-1'>
                      Panel de Control
                    </p>
                  </div>
                  <nav className='flex flex-col gap-1 p-4'>
                    {navLinks.map((link) => (
                      <Link key={link.to} to={link.to} className='w-full'>
                        <div
                          className={`group rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${
                            location.pathname === link.to
                              ? `${link.bgColor} ${link.color} shadow-sm border border-current/20`
                              : "hover:bg-gray-50"
                          }`}>
                          <div className='flex items-center gap-3'>
                            <div
                              className={`p-2 rounded-lg ${
                                location.pathname === link.to
                                  ? link.color
                                  : "text-gray-500 group-hover:text-gray-700"
                              }`}>
                              {link.icon}
                            </div>
                            <div className='flex-1'>
                              <div
                                className={`font-medium ${
                                  location.pathname === link.to
                                    ? link.color
                                    : "text-gray-900 group-hover:text-gray-700"
                                }`}>
                                {link.label}
                              </div>
                              <div className='text-xs text-gray-500 mt-0.5'>
                                {link.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
              <div className='text-white'>
                <h1 className='font-bold text-lg'>Bitácora</h1>
                <p className='text-xs text-blue-200 -mt-1'>
                  {getCurrentPageTitle()}
                </p>
              </div>
            </div>

            {/* Logo + Brand (desktop) */}
            <div className='hidden md:flex items-center gap-6'>
              <div className='flex items-center gap-3 text-white'>
                <div className='p-2 bg-white/10 rounded-lg backdrop-blur'>
                  <TrendingUp className='w-6 h-6' />
                </div>
                <div>
                  <h1 className='font-bold text-xl tracking-tight'>
                    Bitácora Trading
                  </h1>
                  <p className='text-xs text-blue-200 -mt-1'>
                    Panel de Control Profesional
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation (desktop) */}
            <nav className='hidden md:flex items-center gap-2'>
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  <div
                    className={`group px-4 py-2 rounded-lg transition-all duration-200 ${
                      location.pathname === link.to
                        ? "bg-white/20 backdrop-blur text-white shadow-lg"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`${
                          location.pathname === link.to
                            ? "text-white"
                            : link.color
                        }`}>
                        {link.icon}
                      </div>
                      <span className='font-medium text-sm'>{link.label}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </nav>

            {/* User menu */}
            <div className='flex items-center gap-3'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='rounded-full p-2 text-white hover:bg-white/10 transition-colors'>
                    <div className='flex items-center gap-2'>
                      <Avatar>
                        <AvatarImage src={avatar} alt='Usuario' />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <span className='hidden sm:block text-sm font-medium'>
                        Usuario
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56 mt-2'>
                  <div className='px-3 py-2 border-b'>
                    <p className='text-sm font-medium'>Usuario</p>
                    <p className='text-xs text-gray-500'>trader@ejemplo.com</p>
                  </div>
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
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className='flex-1 bg-gray-50'>
        <Toaster position='top-right' richColors />
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
