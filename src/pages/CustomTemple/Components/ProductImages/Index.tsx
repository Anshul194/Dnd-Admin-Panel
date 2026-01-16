import { Image } from "lucide-react";
import RenderVariant1 from "./Variant1";
import RenderVariant2 from "./Variant2";
import RenderVariant3 from "./Variant3";
import RenderVariant4 from "./Variant4";
import RenderVariant5 from "./Variant5";

export function ProductImages({
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
  const imageSettings = {
    ...{
      showThumbnails: true,
      imageSize: "medium",
      span: component.span || 1,
      variant: "variant1",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "variant1",
  };

  // Dummy images if product images are not available
  const dummyImages = [
    {
      url: "https://in.teabox.com/cdn/shop/files/RoseGreenTea_Teabags_aa3e8528-95b5-423b-9869-16baff3a7710.jpg?v=1755320690&width=1000",
      alt: "Sample Image 1",
    },
    {
      url: "https://in.teabox.com/cdn/shop/files/RoseGreenTeabag_CarouselImage_02.jpg?v=1755320690&width=1000",
      alt: "Sample Image 1",
    },
    {
      url: "https://in.teabox.com/cdn/shop/files/RoseGreenTeabag_CarouselImage_08.jpg?v=1755320690&width=1000",
      alt: "Sample Image 1",
    },
    {
      url: "https://in.teabox.com/cdn/shop/files/RoseGreenTeabag_CarouselImage_03.jpg?v=1755320690&width=1000",
      alt: "Sample Image 1",
    },
    {
      url: "https://in.teabox.com/cdn/shop/files/RoseGreenTeabag_CarouselImage_04.jpg?v=1755320690&width=1000",
      alt: "Sample Image 1",
    },
  ];

  const productData = {
    name: product?.name || "Premium Wireless Headphones",
    badges: ["Premium", "Best Seller", "Limited Edition"],
    ...product,
    images: dummyImages,
  };

  const renderVariant = () => {
    switch (imageSettings.variant) {
      case "variant2":
        return <RenderVariant2 productData={productData} />;
      case "variant3":
        return <RenderVariant3 productData={productData} />;
      case "variant4":
        return <RenderVariant4 productData={productData} imageSettings={imageSettings} />;
      case "ayurvedic":
        return <RenderVariant5 productData={productData} />;
      default:
        return <RenderVariant1 productData={productData} />;
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
              <Image size={20} className="text-blue-600" />
            </div>
            Product Gallery
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
