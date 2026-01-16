import { BookOpen } from "lucide-react";
import RenderScrollingVariant from "./Variant1";
import ModernIngredientsUI from "./Variant2";
import PremiumIngredientsUI from "./Variant3";
import AyurvedicIngredientsUI from "./Variant4";

export function Ingredients({
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
  const ingredientSettings = {
    ...{
      showImages: true,
      showDetails: true,
      span: component.span || 1,
      variant: "scrolling",
    },
    ...settings[component.id],
    variant:
      component.variant || settings[component.id]?.variant || "scrolling",
  };

  const ingredients = [
    {
      id: 1,
      name: "Fresh Tomatoes",
      description:
        "Vine-ripened tomatoes, carefully selected for their rich flavor and vibrant color. These premium tomatoes form the base of our signature sauce.",
      image:
        "https://in.teabox.com/cdn/shop/files/TurmericGingerTulsiGreenTea_Monocarton_CarouselImage_02.jpg?v=1755320737&width=1000",
      details: "Organic, locally sourced",
    },
    {
      id: 2,
      name: "Extra Virgin Olive Oil",
      description:
        "Cold-pressed olive oil from Mediterranean groves, providing a smooth, fruity flavor that enhances every dish with its golden richness.",
      image:
        "https://in.teabox.com/cdn/shop/files/TurmericGingerTulsiGreenTea_Monocarton_CarouselImage_03.jpg?v=1755320737&width=1000",
      details: "First cold press, Mediterranean origin",
    },
    {
      id: 3,
      name: "Fresh Basil",
      description:
        "Hand-picked basil leaves with their distinctive aroma and peppery flavor. This herb adds the perfect aromatic finish to our creations.",
      image:
        "https://in.teabox.com/cdn/shop/files/TurmericGingerTulsiGreenTea_Monocarton_CarouselImage_04.jpg?v=1755320737&width=1000",
      details: "Locally grown, pesticide-free",
    },
    {
      id: 4,
      name: "Sea Salt",
      description:
        "Pure sea salt harvested from pristine coastal waters, providing the perfect mineral balance to enhance natural flavors.",
      image:
        "https://in.teabox.com/cdn/shop/files/TurmericGingerTulsiGreenTea_Monocarton_CarouselImage_05.jpg?v=1755320737&width=1000",
      details: "Unrefined, mineral-rich",
    },
  ];

  const renderVariant = () => {
    switch (ingredientSettings.variant) {
      case "scrolling":
        return <RenderScrollingVariant data={ingredients} />;
        case "modern":
          return <ModernIngredientsUI data={ingredients} />;

        case "premium":
          return <PremiumIngredientsUI data={ingredients} />;
        case "ayurvedic":
          return <AyurvedicIngredientsUI productData={product} />;
      default:
        return <RenderScrollingVariant data={ingredients} />;
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
            <div className="p-2 bg-green-100 rounded-xl">
              <BookOpen size={20} className="text-green-600" />
            </div>
            Ingredients
            {isFullWidth && (
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
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
