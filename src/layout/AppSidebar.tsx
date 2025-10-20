"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  // BoxCubeIcon,
  BoxIcon,
  // CalenderIcon,
  ChevronDownIcon,
  DollarLineIcon,
  GridIcon,
  HorizontaLDots,
  // ListIcon,
  // PageIcon,
  // PieChartIcon,
  PlugInIcon,
  // TableIcon,
  UserCircleIcon,
  DownloadIcon,
  TaskIcon,
  ShootingStarIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path?: string;
    pro?: boolean;
    new?: boolean;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <DollarLineIcon />,
    name: "Ventas",
    path: "/ventas",
  },
  {
    icon: <ArrowDownIcon />,
    name: "Entradas",
    path: "/entradas",
  },
  {
    icon: <UserCircleIcon />,
    name: "Contactos",
    path: "/contactos",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Compras",
    path: "/compras",
  },
  {
    icon: <BoxIcon />,
    name: "Inventario",
    subItems: [
      { name: "Productos", path: "/productos", pro: false },
      { name: "Inventario", path: "/inventario", pro: false },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "MO35",
    path: "/mo35",
  },
  {
    icon: <DownloadIcon />,
    name: "Recibir",
    path: "/recibir",
  },
  {
    icon: <PlugInIcon />,
    name: "Configuraciones",
    subItems: [
      { name: "General", path: "/configuraciones", pro: false },
      { name: "Problemas Comunes", path: "/configuracion/problemas-comunes", pro: false, new: true },
      {
        name: "Integraciones",
        pro: false,
        subItems: [
          { name: "API", path: "/configuracion/integraciones/api", pro: false },
          { name: "Impresoras", path: "/configuracion/integraciones/impresoras", pro: false },
          { name: "Mensajería", path: "/configuracion/integraciones/mensajeria", pro: false },
        ],
      },
      { name: "Calendario", path: "/calendar", pro: false },
      { name: "Perfil de Usuario", path: "/profile", pro: false },
      { name: "Formularios", path: "/form-elements", pro: false },
      { name: "Tablas", path: "/basic-tables", pro: false },
      { name: "Gráficos de Línea", path: "/line-chart", pro: false },
      { name: "Gráficos de Barra", path: "/bar-chart", pro: false },
      { name: "Alertas", path: "/alerts", pro: false },
      { name: "Avatares", path: "/avatars", pro: false },
      { name: "Badges", path: "/badge", pro: false },
      { name: "Botones", path: "/buttons", pro: false },
      { name: "Imágenes", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
      { name: "Página en Blanco", path: "/blank", pro: false },
      { name: "Página 404", path: "/error-404", pro: false },
      { name: "Autenticación", path: "/signin", pro: false },
    ],
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem, subIndex) => (
                  <li key={subItem.name}>
                    {subItem.subItems ? (
                      <>
                        <button
                          onClick={() => handleSubSubmenuToggle(`${menuType}-${index}-${subIndex}`)}
                          className={`menu-dropdown-item ${
                            openSubSubmenu === `${menuType}-${index}-${subIndex}`
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <ChevronDownIcon
                            className={`ml-auto w-4 h-4 transition-transform duration-200 ${
                              openSubSubmenu === `${menuType}-${index}-${subIndex}`
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>
                        {openSubSubmenu === `${menuType}-${index}-${subIndex}` && (
                          <ul className="mt-1 ml-4 space-y-1">
                            {subItem.subItems.map((nestedItem) => (
                              <li key={nestedItem.name}>
                                <Link
                                  href={nestedItem.path}
                                  className={`menu-dropdown-item text-xs ${
                                    isActive(nestedItem.path)
                                      ? "menu-dropdown-item-active"
                                      : "menu-dropdown-item-inactive"
                                  }`}
                                >
                                  {nestedItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : subItem.path ? (
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [openSubSubmenu, setOpenSubSubmenu] = useState<string | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item or nested item
    let submenuMatched = false;
    let subSubmenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem, subIndex) => {
            // Check nested subItems (3rd level)
            if (subItem.subItems) {
              subItem.subItems.forEach((nestedItem) => {
                if (nestedItem.path && isActive(nestedItem.path)) {
                  setOpenSubmenu({
                    type: menuType as "main" | "others",
                    index,
                  });
                  setOpenSubSubmenu(`${menuType}-${index}-${subIndex}`);
                  submenuMatched = true;
                  subSubmenuMatched = true;
                }
              });
            }
            // Check regular subItems (2nd level)
            if (subItem.path && isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
    if (!subSubmenuMatched) {
      setOpenSubSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const handleSubSubmenuToggle = (key: string) => {
    setOpenSubSubmenu((prev) => (prev === key ? null : key));
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menú"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
