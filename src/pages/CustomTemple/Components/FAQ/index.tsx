import { HelpCircle } from "lucide-react";
import Variant1 from "./Variant1";

export function FAQ({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  isFullWidth = false,
  isPreviewMode = false,
  COMPONENT_SPANS,
}: {
  component: any;
  product: any;
  settings: any;
  onUpdateSettings: any;
  onUpdateSpan: any;
  isFullWidth?: boolean;
  isPreviewMode?: boolean;
  COMPONENT_SPANS: any;
}) {
  const faqSettings = {
    ...{
      span: component.span || 1,
      variant: "accordion",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "accordion",
  };

  const renderVariant = () => {
    switch (faqSettings.variant) {
      case "accordion":
        return <Variant1 />;
      default:
        return <Variant1 />;
    }
  };

  return (
    <div
      className={`${
        isPreviewMode
          ? "bg-transparent"
          : "bg-white rounded-2xl shadow-xl border border-gray-100"
      } ${isPreviewMode ? "" : "p-6 mb-4"} ${isFullWidth ? "w-full" : ""}`}
    >
      {!isPreviewMode && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-blue-100 rounded-xl">
              <HelpCircle size={20} className="text-blue-600" />
            </div>
            FAQ
            {isFullWidth && (
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                Full Width
              </span>
            )}
          </h3>
        </div>
      )}

      {renderVariant()}
    </div>
  );
}
