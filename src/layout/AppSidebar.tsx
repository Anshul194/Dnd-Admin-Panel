/*  AppSidebar.tsx  */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import {
  Home as HomeIcon,
  Users as UsersIcon,
  Tag as TagIcon,
  ShoppingCart,
  Gift,
  FileText,
  Edit3,
  Mail,
  HelpCircle,
  Star,
  UserPlus,
  ClipboardList,
  Phone,
  File,
  Rss,
  Sliders as SlidersIcon,
  List as ListIcon,
  Box as BoxIcon,
  Layers as LayersIcon,
  Settings,
  Image,
} from "lucide-react";
import axiosInstance from "../services/axiosConfig";

type NavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  subItems?: NavSubItem[]
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[]
};

const staticItems: NavItem[] = [
  {
    icon: <HomeIcon className="w-5 h-5" />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <UserPlus className="w-5 h-5" />,
    name: "Lead Dashboard",
    path: "/lead/analytics",
  },
  {
    icon: <UserPlus className="w-5 h-5" />,
    name: "Meta Dashboard",
    path: "/meta/analytics",
  },
  {
    icon: <BoxIcon className="w-5 h-5" />,
    name: "Shipment Dashboard",
    path: "/orders/shipment-dashboard",
  },
  {
    icon: <UsersIcon className="w-5 h-5" />,
    name: "Roles",
    subItems: [
      { name: "Role List", path: "/roles/list" },
      { name: "Add Role", path: "/roles/add" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [menuItems, setMenuItems] = useState<NavItem[]>(staticItems);
  const [openSubmenu, setOpenSubmenu] = useState<string[]>([]);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.role || null;
      }
      return null;
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  };

  const userRole = getUserRole();
  const ADMIN_ROLE = "6888d1dd50261784a38dd087";

  /* ---------- Helper Functions ---------- */
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Function to check if any subitem is active recursively
  const hasActiveSubItem = useCallback(
    (subItems: NavSubItem[]): boolean => {
      return subItems.some((subItem) => {
        if (isActive(subItem.path)) return true;
        if (subItem.subItems) return hasActiveSubItem(subItem.subItems);
        return false;
      });
    },
    [isActive]
  );

  // Auto-expand menus based on active route
  useEffect(() => {
    const activeMenus: string[] = [];

    const checkMenuItems = (items: NavItem[], prefix: string) => {
      items.forEach((nav, index) => {
        const menuKey = `${prefix}-${index}`;
        if (nav.subItems && hasActiveSubItem(nav.subItems)) {
          activeMenus.push(menuKey);

          // Check for nested submenus
          nav.subItems.forEach((subItem, subIndex) => {
            const subMenuKey = `${menuKey}-${subIndex}`;
            if (subItem.subItems && hasActiveSubItem(subItem.subItems)) {
              activeMenus.push(subMenuKey);
            }
          });
        }
      });
    };

    checkMenuItems(staticItems, "main");
    setOpenSubmenu(activeMenus);
  }, [location, hasActiveSubItem]);

  // Update submenu heights when they open
  useEffect(() => {
    openSubmenu.forEach((key) => {
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    });
  }, [openSubmenu]);

  const handleSubmenuToggle = (menuKey: string) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu.includes(menuKey)) {
        return prevOpenSubmenu.filter((key) => key !== menuKey);
      }
      return [...prevOpenSubmenu, menuKey];
    });
  };

  /* ---------- Icon Selector ---------- */
  const getIconForModule = (moduleName: string) => {
    const name = (moduleName || "").toLowerCase().trim();

    // Explicit matches for modules
    if (name === "lead" || name.includes("lead")) return <UserPlus className="w-5 h-5" />;
    if (name === "tickets" || name.includes("ticket")) return <ClipboardList className="w-5 h-5" />;
    if (name.includes("testing")) return <Edit3 className="w-5 h-5" />;
    if (name.includes("content") || name.includes("contents")) return <FileText className="w-5 h-5" />;
    if (name.includes("email") || name.includes("template")) return <Mail className="w-5 h-5" />;
    if (name === "faq" || name.includes("faq")) return <HelpCircle className="w-5 h-5" />;
    if (name.includes("review")) return <Star className="w-5 h-5" />;
    if (name.includes("brand")) return <TagIcon className="w-5 h-5" />;
    if (name.includes("staff") || name.includes("staffs")) return <UsersIcon className="w-5 h-5" />;
    if (name.includes("ivr") || name.includes("phone") || name.includes("logs")) return <Phone className="w-5 h-5" />;
    if (name.includes("product")) return <ShoppingCart className="w-5 h-5" />;
    if (name.includes("coupon") || name.includes("promo")) return <Gift className="w-5 h-5" />;
    if (name.includes("blog") || name.includes("post")) return <Rss className="w-5 h-5" />;
    if (name.includes("page")) return <File className="w-5 h-5" />;
    if (name.includes("custom") || name.includes("temple")) return <Edit3 className="w-5 h-5" />;
    if (name.includes("role") || name.includes("user")) return <UsersIcon className="w-5 h-5" />;
    if (name.includes("category") || name.includes("sub")) return <TagIcon className="w-5 h-5" />;
    if (name.includes("attribute") || name.includes("settings")) return <SlidersIcon className="w-5 h-5" />;
    if (name.includes("variant")) return <ListIcon className="w-5 h-5" />;
    if (name.includes("home") || name.includes("dashboard")) return <HomeIcon className="w-5 h-5" />;
    if (name.includes("layer")) return <LayersIcon className="w-5 h-5" />;
    if (name.includes("image") || name.includes("media")) return <Image className="w-5 h-5" />;
    if (name.includes("setting")) return <Settings className="w-5 h-5" />;

    // Fallback
    return <BoxIcon className="w-5 h-5" />;
  };

  // Normalize names for deduplication: lower-case, remove spaces, strip trailing "s"
  const normalizeName = (n?: string) =>
    (n || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/s$/, "");

  /* ---------- Fetch Modules ---------- */
  const fetchModules = async () => {
    try {
      const response = await axiosInstance.get("/module");

      const formattedItems: NavItem[] = (response?.data?.modules ?? []).map(
        (module: any) => {
          const slug = module.name.toLowerCase().replace(/\s+/g, "");

          const payload: any = {
            name: module.name,
            icon: getIconForModule(module.name),
          };

          if (!module.permissions) {
            payload.path = `/${slug}/list`;
            payload.subItems = [
              { name: `Add ${module.name}`, path: `/${slug}/add` },
              { name: `${module.name} list`, path: `/${slug}/list` },
            ];
            return payload;
          }

          if (module.permissions.includes("read")) {
            payload.subItems = [
              { name: `${module.name} list`, path: `/${slug}/list` },
            ];
          }

          if (module.permissions.includes("create")) {
            payload.subItems = [
              ...(payload.subItems || []),
              { name: `Add ${module.name}`, path: `/${slug}/add` },
            ];
          }

          return payload;
        }
      );

      // Merge fetched modules with static nav items, avoid duplicating by normalized name
      setMenuItems((prev) => {
        const existingNormalized = new Set(prev.map((p) => normalizeName(p.name)));
        const nonDuplicate = formattedItems.filter(
          (fi) => !existingNormalized.has(normalizeName(fi.name))
        );
        return [...prev, ...nonDuplicate];
      });
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  /* ---------- Filter Menu Items Based on Role ---------- */
  const getFilteredMenuItems = (items: NavItem[]): NavItem[] => {
    // If user is admin, show all items
    if (userRole == ADMIN_ROLE) {
      return items;
    }

    // For non-admin users, filter out the "Roles" menu item
    return items.filter((item) => {
      const itemName = normalizeName(item.name);
      return itemName !== "role" && itemName !== "dashboard" && itemName !== "metadashboard";
    });
  };

  /* ---------- Renderers ---------- */
  // Recursive function to render subitems with modern styling
  const renderSubItems = (
    subItems: NavSubItem[],
    parentKey: string,
    level: number = 1
  ) => {
    return subItems.map((subItem, index) => {
      const subMenuKey = `${parentKey}-${index}`;
      const isOpen = openSubmenu.includes(subMenuKey);
      const isSubActive = subItem.subItems ? hasActiveSubItem(subItem.subItems) : false;
      const isCurrentActive = isActive(subItem.path);

      return (
        <li key={subItem.name}>
          {subItem.subItems ? (
            <>
              <button
                onClick={() => handleSubmenuToggle(subMenuKey)}
                className={`
                  w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isOpen || isSubActive
                    ? "bg-gray-800/70 text-gray-50"
                    : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                  }
                `}
                style={{ paddingLeft: `${36 + level * 16}px` }}
              >
                <span className="flex items-center gap-2">
                  {subItem.name}
                  {(subItem.new || subItem.pro) && (
                    <div className="flex gap-1">
                      {subItem.new && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-violet-600 text-white">
                          new
                        </span>
                      )}
                      {subItem.pro && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-600 text-white">
                          pro
                        </span>
                      )}
                    </div>
                  )}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180 text-violet-400" : ""}`}
                />
              </button>

              <div
                ref={(el) => {
                  subMenuRefs.current[subMenuKey] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: isOpen ? `${subMenuHeight[subMenuKey]}px` : "0px",
                }}
              >
                <ul className="mt-1 space-y-1">
                  {renderSubItems(subItem.subItems, subMenuKey, level + 1)}
                </ul>
              </div>
            </>
          ) : (
            <Link
              to={subItem.path}
              className={`
                flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isCurrentActive
                  ? "bg-violet-600/20 text-violet-300 font-semibold"
                  : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                }
              `}
              style={{ paddingLeft: `${36 + level * 16}px` }}
            >
              {subItem.name}
              {(subItem.new || subItem.pro) && (
                <div className="flex gap-1 ml-auto">
                  {subItem.new && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-violet-600 text-white">
                      new
                    </span>
                  )}
                  {subItem.pro && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-600 text-white">
                      pro
                    </span>
                  )}
                </div>
              )}
            </Link>
          )}
        </li>
      );
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    // Filter items based on role before rendering
    const filteredItems = getFilteredMenuItems(items);

    return (
      <ul className="space-y-2">
        {filteredItems.map((nav, index) => {
          const menuKey = `${menuType}-${index}`;
          const isOpen = openSubmenu.includes(menuKey);
          const isSubActive = nav.subItems ? hasActiveSubItem(nav.subItems) : false;
          const isCurrentActive = nav.path && isActive(nav.path);

          return (
            <li key={nav.name} className="group">
              {nav.subItems ? (
                <button
                  onClick={() => handleSubmenuToggle(menuKey)}
                  className={`
                    w-full flex items-center gap-4 px-5 py-2 rounded-md text-sm font-medium transition-all duration-300
                    backdrop-blur-xl relative overflow-hidden
                    ${isOpen || isSubActive
                      ? "bg-gradient-to-r from-violet-600/30   to-purple-600/30 text-violet-300 shadow-xl shadow-violet-600/20"
                      : "text-gray-300 hover:bg-gray-800/50 !px-2.5 hover:text-black"
                    }
                  `}
                >
                  <span
                    className={`
                      p-2.5 rounded-sm transition-all duration-300
                      ${isOpen || isSubActive
                        ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-800/70 text-gray-400 group-hover:bg-white group-hover:text-black"
                      }
                    `}
                  >
                    {nav.icon}
                  </span>

                  {(isExpanded || isHovered || isMobileOpen) && (
                    <>
                      <span className="flex-1 text-left truncate capitalize">{nav.name}</span>
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180 text-violet-400" : ""}`}
                      />
                    </>
                  )}
                  {(isOpen || isSubActive) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-purple-600/10 -z-10" />
                  )}
                  <div className="absolute inset-0 bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-md" />
                </button>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    className={`
                      w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300
                      backdrop-blur-xl relative overflow-hidden
                      ${isCurrentActive
                        ? "bg-gradient-to-r from-violet-600/40 to-purple-600/40 text-violet-300 shadow-xl shadow-violet-600/30"
                        : "text-gray-300 hover:bg-gray-800/50 hover:text-gray-100"
                      }
                    `}
                  >
                    <span
                      className={`
                        p-2.5 rounded-xl transition-all duration-300
                        ${isCurrentActive
                          ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg"
                          : "bg-gray-800/70 text-gray-400 group-hover:bg-gray-700/80"
                        }
                      `}
                    >
                      {nav.icon}
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="flex-1 text-left truncate capitalize">{nav.name}</span>
                    )}

                    {isCurrentActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-purple-500 rounded-r-full" />
                    )}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10 rounded-2xl" />
                  </Link>
                )
              )}

              {/* Submenu */}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[menuKey] = el;
                  }}
                  className="overflow-hidden capitalize transition-all duration-300"
                  style={{
                    height: isOpen ? `${subMenuHeight[menuKey]}px` : "0px",
                  }}
                >
                  <ul className="mt-2 ml-9 space-y-1">
                    {renderSubItems(nav.subItems, menuKey)}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  /* ---------- Hide Sidebar Condition ---------- */
  if (
    location.pathname.includes("custom-temple/add") ||
    location.pathname.includes("custom-temple/edit")
  ) {
    return null;
  }

  /* ---------- JSX ---------- */
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-[1000005] flex flex-col bg-gray-950/95 backdrop-blur-2xl
        border-r border-gray-800/70 transition-all duration-300
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-start h-16 mt-16 lg:mt-0 px-5">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.webp"
            alt="Logo"
            className={`object-contain transition-all duration-300 ${isExpanded || isHovered || isMobileOpen ? "h-11 w-11" : "h-9 w-9"
              }`}
          />
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6">
        <nav>
          <h2
            className={`
              mb-5 px-4 text-xs font-semibold uppercase tracking-widest text-gray-500
              flex items-center ${isExpanded || isHovered || isMobileOpen ? "justify-start" : "justify-center"}
            `}
          >
            {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="w-5 h-5" />}
          </h2>
          {renderMenuItems(menuItems, "main")}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800/70 p-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-900/70 backdrop-blur-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
            A
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div>
              <p className="text-sm font-medium text-gray-200">Admin</p>
              <p className="text-xs text-gray-500">admin@company.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;