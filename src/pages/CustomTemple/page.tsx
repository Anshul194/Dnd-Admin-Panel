"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Grip,
  Image,
  FileText,
  BookOpen,
  Star,
  Settings,
  Eye,
  Plus,
  Trash2,
  Save,
  Layout,
  X,
  ShoppingCart,
  Gift,
  ArrowLeft,
  PlayCircle,
  HelpCircle,
  Users,
  Heart,
  BarChart3,
} from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import {
  COMPONENT_TYPES,
  COMPONENT_VARIANTS,
  ComponentRenderer,
} from "./Variant";
import { fetchProductById, Product } from "../../store/slices/product";
import {
  createTemplate,
  fetchTemplateById,
  updateTemplate,
} from "../../store/slices/template";
import { AppDispatch } from "../../store";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import PopupAlert from "../../components/popUpAlert";

// Types for the component structure
interface ComponentType {
  id: string;
  type: string;
  title: string;
  span: number;
  order: number;
}

interface ComponentSettings {
  [key: string]: {
    variant?: string;
    [key: string]: unknown;
  };
}

interface ColumnType {
  id: string;
  width: number;
  components: ComponentType[];
}

interface SectionType {
  id: string;
  type: string;
  order: number;
  columns: ColumnType[];
}

interface TemplateColumn {
  columnIndex: number;
  columnWidth: number;
  columnTitle: string;
  components: TemplateComponent[];
}

interface TemplateComponent {
  componentType: string;
  componentVariant: string;
  componentSpan: number;
  sortOrder: number;
  isVisible: boolean;
  settings: any;
}

// Column width configurations (updated for 3 columns)
const COLUMN_WIDTHS: Record<
  number,
  { label: string; class: string; flex: string }
> = {
  1: { label: "1/3", class: "w-1/3", flex: "flex-[1]" },
  2: { label: "2/3", class: "w-2/3", flex: "flex-[2]" },
  3: { label: "3/3", class: "w-full", flex: "flex-[3]" },
};

// Component span options (updated for 3 columns)
const COMPONENT_SPANS = {
  1: { label: "1 Col", class: "col-span-1" },
  2: { label: "2 Cols", class: "col-span-2" },
  3: { label: "3 Cols", class: "col-span-3" },
};

// Gap configurations
const GAP_CLASSES: Record<number, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  4: "gap-4",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
  16: "gap-16",
  20: "gap-20",
  24: "gap-24",
  32: "gap-32",
};

const SPACE_CLASSES: Record<number, string> = {
  0: "space-y-0",
  1: "space-y-1",
  2: "space-y-2",
  4: "space-y-4",
  6: "space-y-6",
  8: "space-y-8",
  10: "space-y-10",
  12: "space-y-12",
  16: "space-y-16",
  20: "space-y-20",
  24: "space-y-24",
  32: "space-y-32",
};

// Droppable column component
interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  title: string;
  isEmpty: boolean;
  width: number;
  onWidthChange: (columnIndex: number, width: number) => void;
  columnIndex: number;
  totalColumns?: number;
  onRemoveColumn: (columnIndex: number) => void;
  canRemove: boolean;
  componentGap?: number;
  isPreviewMode?: boolean;
}

function DroppableColumn({
  id,
  children,
  title,
  isEmpty,
  width,
  onWidthChange,
  columnIndex,
  totalColumns = 3,
  onRemoveColumn,
  canRemove,
  componentGap = 2,
  isPreviewMode = false,
}: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    backgroundColor: isOver && !isPreviewMode ? "#e0f2fe" : undefined,
    borderColor: isOver && !isPreviewMode ? "#0284c7" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${COLUMN_WIDTHS[width].flex} ${isPreviewMode ? "min-h-0" : "min-h-96"
        } ${isPreviewMode ? "" : "p-2 border-2 border-dashed"
        } transition-colors text-black ${!isPreviewMode && isEmpty
          ? "border-gray-300 bg-gray-50"
          : !isPreviewMode && !isEmpty
            ? "border-gray-200 bg-white"
            : ""
        } ${isOver && !isPreviewMode ? "border-blue-500 bg-blue-50" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex items-center justify-between gap-2 mb-4 p-2 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Layout size={16} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <span className="text-xs text-gray-500">
              ({Array.isArray(children) ? children.length : 0})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={width}
              onChange={(e) =>
                onWidthChange(columnIndex, parseInt(e.target.value))
              }
              className="text-xs border border-gray-300 rounded px-1 py-1 bg-white"
              title="Column Width"
            >
              {Object.entries(COLUMN_WIDTHS).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            {canRemove && (
              <button
                onClick={() => onRemoveColumn(columnIndex)}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title={`Remove Column ${columnIndex + 1}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {isEmpty && !isPreviewMode ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Layout size={32} className="mb-2" />
          <p className="text-sm font-medium">Drop here</p>
          <p className="text-xs">Drag components</p>
        </div>
      ) : (
        <div
          className={
            isPreviewMode
              ? componentGap > 0
                ? SPACE_CLASSES[componentGap] || "space-y-2"
                : ""
              : SPACE_CLASSES[componentGap] || "space-y-2"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Full width component wrapper for spanning
function FullWidthComponent({ children, isFullWidth }: { children: React.ReactNode; isFullWidth: boolean }) {
  if (isFullWidth) {
    return (
      <div className="w-full bg-white border border-gray-200 shadow-sm rounded-lg">
        <div className="w-full">{children}</div>
      </div>
    );
  }
  return children;
}

// Draggable component wrapper
function SortableItem({
  id,
  children,
  columnId,
  span = 1,
  totalColumns = 3,
  isPreviewMode = false,
}: {
  id: string;
  children: React.ReactNode;
  columnId: string;
  span?: number;
  totalColumns?: number;
  isPreviewMode?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { columnId, span },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isFullWidth = span === totalColumns;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isPreviewMode ? "" : "group"}`}
    >
      {!isPreviewMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-grab active:cursor-grabbing shadow-lg"
            title="Drag to move"
          >
            <Grip size={12} />
          </button>
        </div>
      )}
      <FullWidthComponent isFullWidth={isFullWidth}>
        {children}
      </FullWidthComponent>
    </div>
  );
}

// Individual component renderers (updated with full width styling and variants)

// Component renderer - delegated to componentVariants.tsx
// (Note: ComponentRenderer is imported from componentVariants.tsx)

// Available components sidebar
interface ComponentLibraryProps {
  onAddComponent: (type: string, title: string) => void;
  sections: SectionType[];
  columnGap: number;
  componentGap: number;
  rowGap: number;
  selectedComponent: ComponentType | null;
  componentSettings: ComponentSettings;
  onUpdateSettings: (componentId: string, settings: any) => void;
  onUpdateSpan: (componentId: string, span: number) => void;
  COMPONENT_SPANS: typeof COMPONENT_SPANS;
  onChangeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
}

function ComponentLibrary({
  onAddComponent,
  sections,
  columnGap,
  componentGap,
  rowGap,
  selectedComponent,
  componentSettings,
  onUpdateSettings,
  onUpdateSpan,
  COMPONENT_SPANS,
  onChangeName,
  name,
}: ComponentLibraryProps) {
  const availableComponents = [
    { type: COMPONENT_TYPES.IMAGES, title: "Product Images", icon: Image },
    { type: COMPONENT_TYPES.DETAILS, title: "Product Details", icon: FileText },
    { type: COMPONENT_TYPES.DESCRIPTION, title: "Description", icon: FileText },
    { type: COMPONENT_TYPES.COUPONS, title: "Discount Coupons", icon: Gift },
    {
      type: COMPONENT_TYPES.FREQUENTLY_PURCHASED,
      title: "Frequently Purchased",
      icon: ShoppingCart,
    },
    {
      type: COMPONENT_TYPES.INGREDIENTS,
      title: "Ingredients",
      icon: BookOpen,
    },
    {
      type: COMPONENT_TYPES.HOW_TO_USE,
      title: "How to Use",
      icon: PlayCircle,
    },
    {
      type: COMPONENT_TYPES.CUSTOMER_REVIEWS,
      title: "Customer Reviews",
      icon: Star,
    },
    {
      type: COMPONENT_TYPES.FAQ,
      title: "FAQ",
      icon: HelpCircle,
    },
    {
      type: COMPONENT_TYPES.TARGET_AUDIENCE,
      title: "Target Audience",
      icon: Users,
    },
    {
      type: COMPONENT_TYPES.BENEFITS,
      title: "Benefits",
      icon: Heart,
    },
    {
      type: COMPONENT_TYPES.COMPARISON,
      title: "Comparison",
      icon: BarChart3,
    },
  ];

  // Get all existing component types across all sections
  const existingTypes = sections.flatMap((section) =>
    section.type === "columns"
      ? section.columns.flatMap((col) =>
        col.components.map((comp) => comp.type)
      )
      : []
  );

  return (
    <div>
      <div className=" w-56 bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto">
        <Link to="/custom-temple/list">
          <div className="flex items-center bg-blue-500/10 px-2 py-1 w-fit pr-4 rounded-md gap-2 mb-4 cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
            <h2>Back</h2>
          </div>
        </Link>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChangeName}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Enter template name"
            required
          />
        </div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Components</h2>

        <div className="space-y-2">
          {availableComponents.map((comp) => {
            const IconComponent = comp.icon;
            const isAdded = existingTypes.includes(comp.type);

            return (
              <button
                key={comp.type}
                onClick={() => onAddComponent(comp.type, comp.title)}
                disabled={isAdded}
                className={`w-full flex items-center gap-3 px-3 py-2 border rounded-lg transition-colors ${isAdded
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                  }`}
              >
                <IconComponent
                  size={16}
                  className={isAdded ? "text-gray-400" : "text-gray-600"}
                />
                <span
                  className={`font-medium text-xs ${isAdded ? "text-gray-400" : "text-gray-900"
                    }`}
                >
                  {comp.title}
                </span>
                {isAdded ? (
                  <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Added
                  </span>
                ) : (
                  <Plus size={14} className="ml-auto text-gray-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2 text-sm">Features</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Multiple component variants</li>
          <li>• Multiple column sections</li>
          <li>• 3 adjustable columns per section</li>
          <li>• Component spanning</li>
          <li>• Drag & drop ordering</li>
          <li>• Width customization</li>
          <li>• Remove columns/sections</li>
          <li>• Full width components</li>
          <li>• Adjustable gaps</li>
          <li>• Section-based layout</li>
        </ul>
      </div> */}
        {/* 
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-2 text-sm">
          Component Variants
        </h3>
        <div className="text-xs text-green-800 space-y-2">
          <div>
            <div className="font-medium">Images:</div>
            <div className="pl-2">Classic, Gallery, Showcase</div>
          </div>
          <div>
            <div className="font-medium">Details:</div>
            <div className="pl-2">Standard, Detailed, Minimal</div>
          </div>
          <div>
            <div className="font-medium">How to Use:</div>
            <div className="pl-2">Simple, Steps, Illustrated</div>
          </div>
          <div>
            <div className="font-medium">Reviews:</div>
            <div className="pl-2">Cards, List, Testimonial</div>
          </div>
        </div>
      </div> */}

        {/* <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">
          Current Configuration
        </h3>
        <div className="text-xs text-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>Total Sections:</span>
            <span className="font-medium">{sections.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Column Gap:</span>
            <span className="font-medium">
              {columnGap === 0
                ? "None"
                : columnGap === 1
                ? "XS"
                : columnGap === 2
                ? "SM"
                : columnGap === 4
                ? "MD"
                : columnGap === 6
                ? "LG"
                : "XL"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Component Gap:</span>
            <span className="font-medium">
              {componentGap === 0
                ? "None"
                : componentGap === 1
                ? "XS"
                : componentGap === 2
                ? "SM"
                : componentGap === 4
                ? "MD"
                : componentGap === 6
                ? "LG"
                : "XL"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Row Gap:</span>
            <span className="font-medium">
              {rowGap === 0
                ? "None"
                : rowGap === 1
                ? "XS"
                : rowGap === 2
                ? "SM"
                : rowGap === 4
                ? "MD"
                : rowGap === 6
                ? "LG"
                : "XL"}
            </span>
          </div>
        </div>
      </div> */}

        {/* Component Settings Panel */}
        {selectedComponent && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-3 text-sm flex items-center gap-2">
              <Settings size={14} />
              Component Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Selected: {selectedComponent.title}
                </label>
              </div>

              {/* Component Span */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Width
                </label>
                <select
                  value={selectedComponent.span || 1}
                  onChange={(e) =>
                    onUpdateSpan(selectedComponent.id, parseInt(e.target.value))
                  }
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                >
                  {Object.entries(COMPONENT_SPANS).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Component Variant */}
              {COMPONENT_VARIANTS[selectedComponent.type] && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Variant
                  </label>
                  <select
                    value={
                      componentSettings[selectedComponent.id]?.variant ||
                      "default"
                    }
                    onChange={(e) =>
                      onUpdateSettings(selectedComponent.id, {
                        ...componentSettings[selectedComponent.id],
                        variant: e.target.value,
                      })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {Object.entries(
                      COMPONENT_VARIANTS[selectedComponent.type]
                    ).map(([key, variant]) => (
                      <option key={key} value={key}>
                        {variant.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Component-specific settings */}
              {selectedComponent.type === COMPONENT_TYPES.IMAGES && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Image Size
                    </label>
                    <select
                      value={
                        componentSettings[selectedComponent.id]?.imageSize ||
                        "medium"
                      }
                      onChange={(e) =>
                        onUpdateSettings(selectedComponent.id, {
                          ...componentSettings[selectedComponent.id],
                          imageSize: e.target.value,
                        })
                      }
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          componentSettings[selectedComponent.id]
                            ?.showThumbnails !== false
                        }
                        onChange={(e) =>
                          onUpdateSettings(selectedComponent.id, {
                            ...componentSettings[selectedComponent.id],
                            showThumbnails: e.target.checked,
                          })
                        }
                      />
                      Show Thumbnails
                    </label>
                  </div>
                </>
              )}

              {selectedComponent.type === COMPONENT_TYPES.DETAILS && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Layout
                    </label>
                    <select
                      value={
                        componentSettings[selectedComponent.id]?.layout ||
                        "vertical"
                      }
                      onChange={(e) =>
                        onUpdateSettings(selectedComponent.id, {
                          ...componentSettings[selectedComponent.id],
                          layout: e.target.value,
                        })
                      }
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          componentSettings[selectedComponent.id]?.showPrice !==
                          false
                        }
                        onChange={(e) =>
                          onUpdateSettings(selectedComponent.id, {
                            ...componentSettings[selectedComponent.id],
                            showPrice: e.target.checked,
                          })
                        }
                      />
                      Show Price
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          componentSettings[selectedComponent.id]
                            ?.showFeatures !== false
                        }
                        onChange={(e) =>
                          onUpdateSettings(selectedComponent.id, {
                            ...componentSettings[selectedComponent.id],
                            showFeatures: e.target.checked,
                          })
                        }
                      />
                      Show Features
                    </label>
                  </div>
                </>
              )}

              {selectedComponent.type === COMPONENT_TYPES.DESCRIPTION && (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          componentSettings[selectedComponent.id]?.showVideo !==
                          false
                        }
                        onChange={(e) =>
                          onUpdateSettings(selectedComponent.id, {
                            ...componentSettings[selectedComponent.id],
                            showVideo: e.target.checked,
                          })
                        }
                      />
                      Show Video
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          componentSettings[selectedComponent.id]
                            ?.showImages !== false
                        }
                        onChange={(e) =>
                          onUpdateSettings(selectedComponent.id, {
                            ...componentSettings[selectedComponent.id],
                            showImages: e.target.checked,
                          })
                        }
                      />
                      Show Images
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main page builder component
export default function ProductPageBuilder() {
  const [templateName, setTemplateName] = useState("");
  const [templateData, setTemplateData] = useState(null);
  let { search } = useLocation();

  const query = new URLSearchParams(search);
  const templateId = query.get("templateId");

  console.log("Template ID:", templateId);
  const [sections, setSections] = useState<SectionType[]>([
    {
      id: "section-1",
      type: "columns",
      order: 0,
      columns: [
        {
          id: "column-1",
          width: 1,
          components: [
            {
              id: "1",
              type: COMPONENT_TYPES.IMAGES,
              title: "Product Images",
              span: 1,
              order: 0,
            },
          ],
        },
        {
          id: "column-2",
          width: 2,
          components: [
            {
              id: "2",
              type: COMPONENT_TYPES.DETAILS,
              title: "Product Details",
              span: 1,
              order: 1,
            },
          ],
        },
        {
          id: "column-3",
          width: 1,
          components: [],
        },
      ],
    },
  ]);

  // Legacy columns state for backward compatibility - derived from sections
  const columns = useMemo(() => {
    const allColumns = sections
      .filter((s) => s.type === "columns")
      .flatMap((s) => s.columns);
    return allColumns;
  }, [sections]);

  const [componentSettings, setComponentSettings] = useState<ComponentSettings>(
    {}
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentType | null>(null);
  const [draggedComponent, setDraggedComponent] =
    useState<ComponentType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [columnGap, setColumnGap] = useState(2); // Gap between columns (0-8)
  const [componentGap, setComponentGap] = useState(2); // Gap between components (0-8)
  const [rowGap, setRowGap] = useState(4); // Gap between rows (0-8)
  const [product, setProduct] = useState<Product | null>(null);
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  // Use ref to track current sections for drag operations
  const sectionsRef = useRef(sections);

  // Update ref whenever sections change
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const dispatch = useAppDispatch();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: { active: { id: string } }) => {
      const { active } = event;

      if (isDragging) return; // Prevent double execution
      setIsDragging(true);

      for (const section of sectionsRef.current) {
        if (section.type === "columns") {
          for (const column of section.columns) {
            const component = column.components.find((c) => c.id === active.id);
            if (component) {
              setDraggedComponent(component);
              return;
            }
          }
        }
      }
    },
    [isDragging]
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setDraggedComponent(null);
    setIsDragging(false);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setSections((prevSections) => {
      const newSections = [...prevSections];

      // Find source component across all sections
      let sourceSection = null;
      let sourceColumnIndex = -1;
      let sourceComponent = null;
      let sourceComponentIndex = -1;
      let sourceSectionIndex = -1;

      for (let sIdx = 0; sIdx < newSections.length; sIdx++) {
        const section = newSections[sIdx];
        if (section.type === "columns") {
          for (let i = 0; i < section.columns.length; i++) {
            const componentIndex = section.columns[i].components.findIndex(
              (c) => c.id === activeId
            );
            if (componentIndex !== -1) {
              sourceSectionIndex = sIdx;
              sourceSection = section;
              sourceColumnIndex = i;
              sourceComponent = section.columns[i].components[componentIndex];
              sourceComponentIndex = componentIndex;
              break;
            }
          }
          if (sourceComponent) break;
        }
      }

      if (!sourceComponent) return prevSections;

      // Find target position across all sections
      let targetSection = null;
      let targetColumnIndex = -1;
      let targetComponentIndex = -1;
      let targetComponent = null;
      let targetSectionIndex = -1;

      // Check if dropping on a column
      for (let sIdx = 0; sIdx < newSections.length; sIdx++) {
        const section = newSections[sIdx];
        if (section.type === "columns") {
          for (let i = 0; i < section.columns.length; i++) {
            if (section.columns[i].id === overId) {
              targetSectionIndex = sIdx;
              targetSection = section;
              targetColumnIndex = i;
              targetComponentIndex = section.columns[i].components.length;
              break;
            }
          }
          if (targetSection) break;
        }
      }

      // If not dropping on a column, check if dropping on a component
      if (!targetSection) {
        for (let sIdx = 0; sIdx < newSections.length; sIdx++) {
          const section = newSections[sIdx];
          if (section.type === "columns") {
            for (let i = 0; i < section.columns.length; i++) {
              const componentIndex = section.columns[i].components.findIndex(
                (c) => c.id === overId
              );
              if (componentIndex !== -1) {
                targetSectionIndex = sIdx;
                targetSection = section;
                targetColumnIndex = i;
                targetComponentIndex = componentIndex;
                targetComponent = section.columns[i].components[componentIndex];
                break;
              }
            }
            if (targetSection) break;
          }
        }
      }

      if (targetSectionIndex === -1) return prevSections;

      // Calculate new order based on target position
      let newOrder;
      if (targetComponent) {
        // Get all components from target section sorted by order
        const targetSectionComponents = newSections[
          targetSectionIndex
        ].columns.flatMap((col) => col.components);
        targetSectionComponents.sort((a, b) => (a.order || 0) - (b.order || 0));

        const targetOrder = targetComponent.order || 0;
        const targetIndex = targetSectionComponents.findIndex(
          (c) => c.id === targetComponent.id
        );

        // Insert before the target component
        if (targetIndex === 0) {
          newOrder = targetOrder - 1;
        } else {
          const prevOrder = targetSectionComponents[targetIndex - 1].order || 0;
          newOrder = (prevOrder + targetOrder) / 2;
        }
      } else {
        // Dropping at end of column, get highest order in target section + 1
        const targetSectionComponents = newSections[
          targetSectionIndex
        ].columns.flatMap((col) => col.components);
        const maxOrder = Math.max(
          ...targetSectionComponents.map((comp) => comp.order || 0),
          -1
        );
        newOrder = maxOrder + 1;
      }

      // Update component order
      const updatedComponent = { ...sourceComponent, order: newOrder };

      // Remove from source
      newSections[sourceSectionIndex].columns[
        sourceColumnIndex
      ].components.splice(sourceComponentIndex, 1);

      // Add to target
      if (updatedComponent.span === 3) {
        // For full-width components, always add to first column of target section
        newSections[targetSectionIndex].columns[0].components.push(
          updatedComponent
        );
      } else {
        // Add to target column
        newSections[targetSectionIndex].columns[
          targetColumnIndex
        ].components.splice(targetComponentIndex, 0, updatedComponent);
      }

      return newSections;
    });
  }, []);

  const removeSection = useCallback(
    (sectionId) => {
      if (sections.length <= 1) {
        alert(
          "Cannot remove the last section! At least one section is required."
        );
        return;
      }

      const confirmRemove = window.confirm(
        "Are you sure you want to remove this section? All components in this section will be lost."
      );

      if (!confirmRemove) return;

      setSections((prevSections) => {
        return prevSections.filter((section) => section.id !== sectionId);
      });
    },
    [sections.length]
  );

  const addComponent = useCallback((type, title) => {
    setSections((prevSections) => {
      // Check if this component type already exists across all sections
      const allComponents = prevSections.flatMap((section) =>
        section.type === "columns"
          ? section.columns.flatMap((col) => col.components)
          : []
      );

      const existingComponent = allComponents.find(
        (comp) => comp.type === type
      );

      if (existingComponent) {
        alert(
          `A ${title} component already exists! Each component type can only be added once.`
        );
        return prevSections;
      }

      // Get the next order number
      const maxOrder = Math.max(
        ...allComponents.map((comp) => comp.order || 0),
        -1
      );
      const nextOrder = maxOrder + 1;

      const newId = `${type}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newComponent = {
        id: newId,
        type,
        title,
        span: 1,
        order: nextOrder,
      };

      // Add to first column of first section by default
      const newSections = [...prevSections];
      const firstColumnSection = newSections.find((s) => s.type === "columns");

      if (firstColumnSection) {
        const sectionIndex = newSections.findIndex(
          (s) => s.id === firstColumnSection.id
        );
        newSections[sectionIndex] = {
          ...firstColumnSection,
          columns: [
            {
              ...firstColumnSection.columns[0],
              components: [
                ...firstColumnSection.columns[0].components,
                newComponent,
              ],
            },
            ...firstColumnSection.columns.slice(1),
          ],
        };
      }

      // Set default variant for new component
      setComponentSettings((prev) => ({
        ...prev,
        [newId]: {
          variant: Object.keys(COMPONENT_VARIANTS[type] || {})[0] || "default",
        },
      }));

      return newSections;
    });
  }, []);

  const removeComponent = useCallback((id) => {
    setSections((prevSections) => {
      return prevSections.map((section) => {
        if (section.type === "columns") {
          return {
            ...section,
            columns: section.columns.map((column) => ({
              ...column,
              components: column.components.filter((comp) => comp.id !== id),
            })),
          };
        }
        return section;
      });
    });

    setComponentSettings((prev) => {
      const newSettings = { ...prev };
      delete newSettings[id];
      return newSettings;
    });
  }, []);

  const removeColumn = useCallback((sectionId, columnIndex) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const sectionIdx = newSections.findIndex((s) => s.id === sectionId);
      const section = newSections[sectionIdx];

      if (section.columns.length <= 1) {
        alert(
          "Cannot remove the last column! At least one column is required."
        );
        return prevSections;
      }

      const confirmRemove = window.confirm(
        `Are you sure you want to remove Column ${columnIndex + 1}? ${section.columns[columnIndex].components.length > 0
          ? "Its components will be moved to the first column."
          : ""
        }`
      );

      if (!confirmRemove) return prevSections;

      const removedColumn = section.columns[columnIndex];
      const newColumns = [...section.columns];

      // Move components from removed column to the first remaining column
      if (removedColumn.components.length > 0) {
        if (columnIndex === 0 && newColumns.length > 1) {
          // If removing first column, move components to the new first column (current second)
          newColumns[1] = {
            ...newColumns[1],
            components: [
              ...removedColumn.components,
              ...newColumns[1].components,
            ],
          };
        } else {
          // Otherwise move to first column
          newColumns[0] = {
            ...newColumns[0],
            components: [
              ...newColumns[0].components,
              ...removedColumn.components,
            ],
          };
        }
      }

      // Remove the column
      newColumns.splice(columnIndex, 1);

      // Update column IDs to maintain sequential numbering
      const updatedColumns = newColumns.map((col, index) => ({
        ...col,
        id: `column-${sectionId}-${index + 1}`,
      }));

      newSections[sectionIdx] = {
        ...section,
        columns: updatedColumns,
      };

      return newSections;
    });
  }, []);

  const updateComponentSettings = useCallback((componentId, settings) => {
    setComponentSettings((prev) => ({
      ...prev,
      [componentId]: settings,
    }));
  }, []);

  const updateComponentSpan = useCallback((componentId, span) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];

      // Find the component across all sections
      let found = false;
      for (let sIdx = 0; sIdx < newSections.length && !found; sIdx++) {
        const section = newSections[sIdx];
        if (section.type === "columns") {
          for (let i = 0; i < section.columns.length && !found; i++) {
            const idx = section.columns[i].components.findIndex(
              (c) => c.id === componentId
            );
            if (idx !== -1) {
              const component = section.columns[i].components[idx];
              const updatedComponent = { ...component, span };

              // If changing to full width (span 3), move to first column of section
              if (span === 3 && i !== 0) {
                // Remove from current column
                newSections[sIdx].columns[i].components.splice(idx, 1);
                // Add to first column
                newSections[sIdx].columns[0].components.push(updatedComponent);
              } else if (span !== 3 && i === 0 && component.span === 3) {
                // If changing from full width to normal, keep in first column but update span
                newSections[sIdx].columns[i].components[idx] = updatedComponent;
              } else {
                // Just update the span in current position
                newSections[sIdx].columns[i].components[idx] = updatedComponent;
              }
              found = true;
            }
          }
        }
      }

      return newSections;
    });
  }, []);

  const updateColumnWidth = useCallback((sectionId, columnIndex, width) => {
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const sectionIdx = newSections.findIndex((s) => s.id === sectionId);
      if (sectionIdx !== -1) {
        newSections[sectionIdx].columns[columnIndex].width = width;
      }
      return newSections;
    });
  }, []);

  const addNewSection = useCallback(() => {
    setSections((prevSections) => {
      const maxOrder = Math.max(
        ...prevSections.map((section) => section.order || 0),
        -1
      );
      const newSectionId = `section-${Date.now()}`;

      const newSection = {
        id: newSectionId,
        type: "columns",
        order: maxOrder + 1,
        columns: [
          {
            id: `column-${newSectionId}-1`,
            width: 1,
            components: [],
          },
          {
            id: `column-${newSectionId}-2`,
            width: 2,
            components: [],
          },
          {
            id: `column-${newSectionId}-3`,
            width: 1,
            components: [],
          },
        ],
      };

      return [...prevSections, newSection];
    });
  }, []);

  const addColumn = useCallback(() => {
    // Find the last column section and add a column to it
    setSections((prevSections) => {
      const newSections = [...prevSections];
      const lastColumnSection = [...newSections]
        .reverse()
        .find((s) => s.type === "columns");

      if (!lastColumnSection || lastColumnSection.columns.length >= 3) {
        alert(
          "Maximum 3 columns per section allowed! Add a new section instead."
        );
        return prevSections;
      }

      const sectionIndex = newSections.findIndex(
        (s) => s.id === lastColumnSection.id
      );
      const newColumnId = `column-${lastColumnSection.id}-${lastColumnSection.columns.length + 1
        }`;

      newSections[sectionIndex] = {
        ...lastColumnSection,
        columns: [
          ...lastColumnSection.columns,
          {
            id: newColumnId,
            width: 1,
            components: [],
          },
        ],
      };

      return newSections;
    });
  }, []);

  // Function to organize sections for rendering
  const organizeSectionsForRender = useCallback(() => {
    // Sort sections by order
    const sortedSections = [...sections].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    const renderSections = [];

    for (const section of sortedSections) {
      if (section.type === "columns") {
        // Get all components from this section and organize them into rows
        const allComponents = section.columns.flatMap((col, colIndex) =>
          col.components.map((comp) => ({
            ...comp,
            originalColumnIndex: colIndex,
            sectionId: section.id,
          }))
        );

        // Sort components by order
        allComponents.sort((a, b) => (a.order || 0) - (b.order || 0));

        const rows = [];
        let currentRowComponents = [];
        let currentRowByColumn = Array(section.columns.length)
          .fill(null)
          .map(() => []);

        for (const component of allComponents) {
          if (component.span === 3) {
            // If we have components in current row, close it
            if (currentRowComponents.length > 0) {
              rows.push({
                type: "columns",
                components: currentRowComponents,
                columns: currentRowByColumn,
                sectionId: section.id,
                sectionColumns: section.columns,
              });
              currentRowComponents = [];
              currentRowByColumn = Array(section.columns.length)
                .fill(null)
                .map(() => []);
            }

            // Add full-width component as its own row
            rows.push({
              type: "fullWidth",
              component: component,
              sectionId: section.id,
            });
          } else {
            // Add to current row
            currentRowComponents.push(component);
            currentRowByColumn[component.originalColumnIndex].push(component);
          }
        }

        // Add remaining components as the last row
        if (currentRowComponents.length > 0) {
          rows.push({
            type: "columns",
            components: currentRowComponents,
            columns: currentRowByColumn,
            sectionId: section.id,
            sectionColumns: section.columns,
          });
        }

        // If no rows, add empty row for drag and drop
        if (rows.length === 0) {
          rows.push({
            type: "columns",
            components: [],
            columns: Array(section.columns.length)
              .fill(null)
              .map(() => []),
            sectionId: section.id,
            sectionColumns: section.columns,
          });
        }

        renderSections.push(...rows);
      }
    }

    return renderSections;
  }, [sections]);

  // Transform UI sections state to API sections format for saving
  const transformSectionsForSave = (sections, componentSettings) => {
    return sections.map((section, sectionIdx) => ({
      sectionId: section.id,
      sectionTitle: section.title || `Section ${sectionIdx + 1}`,
      columns: section.columns.map((column, columnIndex) => ({
        columnIndex,
        columnWidth: column.width * (100 / 3), // Convert to percentage (assuming 3 columns max)
        columnTitle: `Column ${columnIndex + 1}`,
        components: column.components
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((component) => ({
            componentType: component.type,
            componentVariant:
              componentSettings[component.id]?.variant || "default",
            componentSpan: component.span || 1,
            sortOrder: component.order || 0,
            isVisible: true,
            settings: componentSettings[component.id] || {},
          })),
      })),
    }));
  };

  const handleSave = useCallback(async () => {
    try {
      if (!templateName.trim()) {
        alert("Please enter a template name before saving.");
        return;
      }

      const sectionsData = transformSectionsForSave(
        sections,
        componentSettings
      );

      const templateData = {
        // productId: 123456, // Use actual product ID or fallback
        layoutId: 1,
        layoutName: templateName,
        totalColumns: 3, // Maximum columns supported
        columnGap,
        componentGap,
        rowGap,
        sections: sectionsData,
      };

      console.log("Saving template data:", templateData);

      // Call the Redux action to create template
      const result = templateId
        ? await dispatch(updateTemplate({ id: templateId, data: templateData }))
        : await dispatch(createTemplate(templateData));
      console.log("Template save result:", result);

      setPopup({
        message: `Template "${templateName}" ${templateId ? "updated" : "saved"} successfully!`,
        type: "success",
        isVisible: true,
      });
      toast.success("Template saved successfully!");
      console.log("Template created:", result.payload);
    } catch (error) {
      setPopup({
        message: "Failed to save template. Please try again.",
        type: "error",
        isVisible: true,
      });
      alert("Failed to save template. Please try again.");
    }
  }, [
    sections,
    componentSettings,
    columnGap,
    componentGap,
    rowGap,
    templateName,
    product,
    dispatch,
  ]);

  const getProductData = async () => {
    try {
      // Fetch product data first
      const response = await dispatch(
        fetchProductById("bloomberry-jasmine-green-tea1")
      );
      console.log("Fetched Product Data:", response.payload);
      setProduct(response.payload as Product);

      // If templateId exists, fetch and set template data
      if (templateId) {
        const res = await dispatch(fetchTemplateById(templateId));
        console.log("Fetched Template Data:", res);
        const data = res.payload;
        // Set layout configuration
        setColumnGap(data?.columnGap || 2);
        setComponentGap(data?.componentGap || 2);
        setRowGap(data?.rowGap || 4);
        setTemplateName(data?.layoutName || "");

        // Transform template data to sections format (new schema)
        if (data.sections && data.sections.length > 0) {
          const newSections: SectionType[] = [];
          const componentSettingsToSet: ComponentSettings = {};

          data.sections.forEach((section: any, sectionIdx: number) => {
            const newSection: SectionType = {
              id: section.sectionId || `section-${sectionIdx + 1}`,
              type: "columns",
              order: sectionIdx,
              columns: [],
            };

            // Initialize columns
            section.columns.forEach(
              (templateColumn: TemplateColumn, columnIndex: number) => {
                const newColumn: ColumnType = {
                  id: `column-${newSection.id}-${columnIndex + 1}`,
                  width: Math.max(
                    1,
                    Math.min(
                      3,
                      Math.round(templateColumn.columnWidth / (100 / 3))
                    )
                  ),
                  components: [],
                };

                // Process components in this column
                templateColumn.components.forEach(
                  (templateComponent: TemplateComponent) => {
                    const componentId = `${templateComponent.componentType
                      }-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const component: ComponentType = {
                      id: componentId,
                      type: templateComponent.componentType,
                      title: getComponentTitle(templateComponent.componentType),
                      span: templateComponent.componentSpan || 1,
                      order: templateComponent.sortOrder || 0,
                    };
                    // Add component to appropriate column based on span
                    if (templateComponent.componentSpan === 3) {
                      // Full-width components go to first column
                      newSection.columns[0]?.components.push(component);
                    } else {
                      newColumn.components.push(component);
                    }
                    // Set component settings
                    componentSettingsToSet[componentId] = {
                      variant: templateComponent.componentVariant || "default",
                      ...templateComponent.settings,
                    };
                  }
                );
                newSection.columns.push(newColumn);
              }
            );

            // Sort components by order within each column
            newSection.columns.forEach((column: ColumnType) => {
              column.components.sort(
                (a: ComponentType, b: ComponentType) =>
                  (a.order || 0) - (b.order || 0)
              );
            });

            newSections.push(newSection);
          });

          setSections(newSections);
          setComponentSettings(componentSettingsToSet);
        }
      }
    } catch (error) {
      console.error("Error fetching template/product data:", error);
    }
  };

  // Helper function to get component title
  function getComponentTitle(componentType: string): string {
    const titleMap: Record<string, string> = {
      images: "Product Images",
      details: "Product Details",
      description: "Description",
      coupons: "Discount Coupons",
      frequentlyPurchased: "Frequently Purchased",
      ingredients: "Ingredients",
      howToUse: "How to Use",
      customerReviews: "Customer Reviews",
    };
    return titleMap[componentType] || componentType;
  }

  useEffect(() => {
    getProductData();
  }, []);

  return (
    <div
      className={`min-h-screen  ${isPreviewMode ? "bg-white" : "bg-gray-100"
        } flex`}
    >
      {!isPreviewMode && (
        <ComponentLibrary
          onAddComponent={addComponent}
          sections={sections}
          columnGap={columnGap}
          componentGap={componentGap}
          rowGap={rowGap}
          selectedComponent={selectedComponent}
          componentSettings={componentSettings}
          onUpdateSettings={updateComponentSettings}
          onUpdateSpan={updateComponentSpan}
          COMPONENT_SPANS={COMPONENT_SPANS}
          onChangeName={(e) => setTemplateName(e.target.value)}
          name={templateName}
        />
      )}

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 text-black px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              {templateId ? "Edit Template" : "New Template"}
            </h1>
            <div className="flex items-center gap-6">
              {!isPreviewMode && (
                <>
                  <div className="flex flex-col  gap-1">
                    <label className="text-xs font-medium text-gray-700">
                      Column Gap:
                    </label>
                    <select
                      value={columnGap}
                      onChange={(e) => setColumnGap(parseInt(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-1 bg-white"
                    >
                      <option value={0}>None</option>
                      <option value={1}>XS</option>
                      <option value={2}>SM</option>
                      <option value={4}>MD</option>
                      <option value={6}>LG</option>
                      <option value={8}>XL</option>
                      <option value={10}>2XL</option>
                      <option value={12}>3XL</option>
                      <option value={16}>4XL</option>
                      <option value={20}>5XL</option>
                      <option value={24}>6XL</option>
                      <option value={32}>7XL</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">
                      Component Gap:
                    </label>
                    <select
                      value={componentGap}
                      onChange={(e) =>
                        setComponentGap(parseInt(e.target.value))
                      }
                      className="text-sm border border-gray-300 rounded px-1 bg-white"
                    >
                      <option value={0}>None</option>
                      <option value={1}>XS</option>
                      <option value={2}>SM</option>
                      <option value={4}>MD</option>
                      <option value={6}>LG</option>
                      <option value={8}>XL</option>
                      <option value={10}>2XL</option>
                      <option value={12}>3XL</option>
                      <option value={16}>4XL</option>
                      <option value={20}>5XL</option>
                      <option value={24}>6XL</option>
                      <option value={32}>7XL</option>
                    </select>
                  </div>
                  <div className="flex flex-col  gap-1">
                    <label className="text-xs font-medium text-gray-700">
                      Row Gap:
                    </label>
                    <select
                      value={rowGap}
                      onChange={(e) => setRowGap(parseInt(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-1 bg-white"
                    >
                      <option value={0}>None</option>
                      <option value={1}>XS</option>
                      <option value={2}>SM</option>
                      <option value={4}>MD</option>
                      <option value={6}>LG</option>
                      <option value={8}>XL</option>
                      <option value={10}>2XL</option>
                      <option value={12}>3XL</option>
                      <option value={16}>4XL</option>
                      <option value={20}>5XL</option>
                      <option value={24}>6XL</option>
                      <option value={32}>7XL</option>
                    </select>
                  </div>
                  <button
                    onClick={addColumn}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={20} />
                    Add Column
                  </button>
                  <button
                    onClick={addNewSection}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Layout size={20} />
                    Add Section
                  </button>
                </>
              )}
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isPreviewMode
                  ? "bg-gray-200 text-gray-800"
                  : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
              >
                <Eye size={20} />
                {isPreviewMode ? "Edit Mode" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Save size={20} />
                {templateId ? "Update Template" : "Save Template"}
              </button>
            </div>
          </div>
        </div>

        {/* Main content - Row-based layout */}
        <div className="flex-1  overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.flatMap((section) =>
                section.type === "columns"
                  ? section.columns.flatMap((col) =>
                    col.components.map((c) => c.id)
                  )
                  : []
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className={`p-4 max-w-7xl mx-auto ${SPACE_CLASSES[rowGap] || "space-y-4"}`}>
                {organizeSectionsForRender().map((row, rowIndex) => {
                  if (row.type === "fullWidth") {
                    return (
                      <SortableItem
                        key={`fullwidth-${row.component.id}`}
                        id={row.component.id}
                        columnId="fullwidth"
                        span={row.component.span}
                        totalColumns={3}
                        isPreviewMode={isPreviewMode}
                      >
                        <div className="w-full">
                          <div
                            className={`relative ${isPreviewMode ? "" : "group cursor-pointer"
                              } ${selectedComponent?.id === row.component.id
                                ? "ring-2 ring-blue-500 rounded-lg"
                                : ""
                              }`}
                            onClick={() =>
                              !isPreviewMode &&
                              setSelectedComponent(row.component)
                            }
                          >
                            {!isPreviewMode && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeComponent(row.component.id);
                                  }}
                                  className="absolute top-2 left-2 z-40 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  title="Remove component"
                                >
                                  <Trash2 size={12} />
                                </button>
                                {selectedComponent?.id === row.component.id && (
                                  <div className="absolute top-2 right-2 z-40 px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-lg">
                                    Selected
                                  </div>
                                )}
                              </>
                            )}
                            <ComponentRenderer
                              component={row.component}
                              product={product}
                              settings={componentSettings}
                              onUpdateSettings={updateComponentSettings}
                              onUpdateSpan={updateComponentSpan}
                              totalColumns={3}
                              isPreviewMode={isPreviewMode}
                              COMPONENT_SPANS={COMPONENT_SPANS}
                            />
                          </div>
                        </div>
                      </SortableItem>
                    );
                  } else {
                    return (
                      <div key={`section-${row.sectionId}-row-${rowIndex}`}>
                        {!isPreviewMode && (
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">
                              Section{" "}
                              {sections.findIndex(
                                (s) => s.id === row.sectionId
                              ) + 1}
                            </h3>
                            {sections.length > 1 && (
                              <button
                                onClick={() => removeSection(row.sectionId)}
                                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Remove Section"
                              >
                                Remove Section
                              </button>
                            )}
                          </div>
                        )}
                        <div
                          className={`flex ${GAP_CLASSES[columnGap] || "gap-2"
                            } ${isPreviewMode ? "" : "mb-6"}`}
                        >
                          {row.sectionColumns.map((column, columnIndex) => (
                            <DroppableColumn
                              key={`${column.id}-row-${rowIndex}`}
                              id={column.id}
                              title={`Column ${columnIndex + 1}`}
                              isEmpty={
                                !row.columns[columnIndex] ||
                                row.columns[columnIndex].length === 0
                              }
                              width={column.width}
                              onWidthChange={(colIndex, width) =>
                                updateColumnWidth(
                                  row.sectionId,
                                  colIndex,
                                  width
                                )
                              }
                              columnIndex={columnIndex}
                              onRemoveColumn={(colIndex) =>
                                removeColumn(row.sectionId, colIndex)
                              }
                              canRemove={row.sectionColumns.length > 1}
                              componentGap={componentGap}
                              isPreviewMode={isPreviewMode}
                            >
                              {row.columns[columnIndex]?.map((component) => (
                                <SortableItem
                                  key={component.id}
                                  id={component.id}
                                  columnId={column.id}
                                  span={component.span}
                                  totalColumns={3}
                                  isPreviewMode={isPreviewMode}
                                >
                                  <div
                                    className={`relative ${isPreviewMode
                                      ? ""
                                      : "group cursor-pointer"
                                      } ${selectedComponent?.id === component.id
                                        ? "ring-2 ring-blue-500 rounded-lg"
                                        : ""
                                      }`}
                                    onClick={() =>
                                      !isPreviewMode &&
                                      setSelectedComponent(component)
                                    }
                                  >
                                    {!isPreviewMode && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeComponent(component.id);
                                          }}
                                          className="absolute top-2 left-2 z-10 p-1 bg-red-500 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                          title="Remove component"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                        {selectedComponent?.id ===
                                          component.id && (
                                            <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-blue-500 text-white text-xs rounded shadow-lg">
                                              Selected
                                            </div>
                                          )}
                                      </>
                                    )}
                                    <ComponentRenderer
                                      component={component}
                                      product={product}
                                      settings={componentSettings}
                                      onUpdateSettings={updateComponentSettings}
                                      onUpdateSpan={updateComponentSpan}
                                      totalColumns={3}
                                      isPreviewMode={isPreviewMode}
                                      COMPONENT_SPANS={COMPONENT_SPANS}
                                    />
                                  </div>
                                </SortableItem>
                              )) || []}
                            </DroppableColumn>
                          ))}
                        </div>
                      </div>
                    );
                  }
                })}

                {/* Empty state when no sections */}
                {organizeSectionsForRender().length === 0 && (
                  <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                      <div className="text-gray-400 mb-4">
                        <Settings size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Start Building Your Page
                      </h3>
                      <p className="text-gray-600">
                        Add components from the sidebar to begin creating your
                        product page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SortableContext>

            <DragOverlay>
              {draggedComponent ? (
                <div className="bg-white rounded-lg shadow-xl border-2 border-blue-500 p-4 opacity-90 transform rotate-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {draggedComponent.title}
                  </h3>
                  <p className="text-sm text-gray-500">Moving component...</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
    </div>
  );
}
