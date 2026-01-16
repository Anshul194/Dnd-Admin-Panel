import { Users } from "lucide-react";
import Variant1 from "./Variant1";

export function TargetAudience({
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
  const targetAudienceSettings = {
    ...{
      span: component.span || 1,
      variant: "split",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "split",
  };

  const renderVariant = () => {
    switch (targetAudienceSettings.variant) {
      case "split":
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
            <div className="p-2 bg-purple-100 rounded-xl">
              <Users size={20} className="text-purple-600" />
            </div>
            Target Audience
            {isFullWidth && (
              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
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
