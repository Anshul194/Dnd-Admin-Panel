import { Award, Clock, FileText, Leaf, RotateCcw, Shield, Truck } from "lucide-react";
import Variant1 from "./Variant1";
import Variant2 from "./Variant2";
import Variant3 from "./Variant3";
import Variant4 from "./Variant4";
import Variant5 from "./Variant5";

export function ProductDetails({
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
  const detailSettings = {
    ...{
      showPrice: true,
      showDescription: true,
      showFeatures: true,
      span: component.span || 1,
      variant: "minimal",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "minimal",
  };

  // Comprehensive dummy data
  const dummyProduct = {
    name: "Premium Organic Green Tea Collection",
    subtitle: "100% Pure Ceylon Green Tea with Natural Antioxidants",
    brand: "NaturePure",
    price: 799,
    originalPrice: 1299,
    discount: 38,
    rating: 4.6,
    reviewCount: 2847,
    soldCount: "15K+ sold this month",
    availability: "In Stock",
    description:
      "Experience the finest quality organic green tea sourced directly from the misty mountains of Ceylon. Our premium blend combines traditional harvesting methods with modern quality standards to deliver an exceptional tea experience rich in antioxidants and natural flavor compounds.",
    variants: [
      {
        _id: "1",
        title: "Starter Pack",
        subtitle: "Perfect for trying our premium tea",
        size: "100g",
        price: 799,
        salePrice: 1299,
        discount: "38% OFF",
        popular: false,
        servings: "50 cups",
        color: "green",
      },
      {
        _id: "2",
        title: "Family Pack",
        subtitle: "Best value for regular tea drinkers",
        size: "250g",
        price: 1799,
        salePrice: 2999,
        discount: "40% OFF",
        popular: true,
        servings: "125 cups",
        color: "orange",
      },
      {
        _id: "3",
        title: "Bulk Pack",
        subtitle: "Maximum savings for tea enthusiasts",
        size: "500g",
        price: 3299,
        salePrice: 5499,
        discount: "42% OFF",
        popular: false,
        servings: "250 cups",
        color: "green",
      },
    ],
    features: [
      {
        icon: Leaf,
        title: "100% Organic",
        description: "Certified organic tea leaves",
      },
      {
        icon: Shield,
        title: "Quality Assured",
        description: "Lab tested for purity",
      },
      {
        icon: Truck,
        title: "Free Shipping",
        description: "On orders above ₹500",
      },
      {
        icon: RotateCcw,
        title: "Easy Returns",
        description: "30-day return policy",
      },
      {
        icon: Award,
        title: "Premium Grade",
        description: "Hand-picked tea leaves",
      },
      {
        icon: Clock,
        title: "Fresh Delivery",
        description: "Packed fresh to order",
      },
    ],
    ingredients: [
      {
        _id: "i1",
        description:
          "<strong>Organic Green Tea Leaves:</strong> Premium Ceylon green tea leaves, naturally rich in catechins and EGCG antioxidants",
      },
      {
        _id: "i2",
        description:
          "<strong>Natural Flavonoids:</strong> Naturally occurring plant compounds that support overall wellness",
      },
      {
        _id: "i3",
        description:
          "<strong>Essential Oils:</strong> Natural tea oils that provide the distinctive aroma and flavor profile",
      },
    ],
    benefits: [
      {
        _id: "b1",
        description:
          "<strong>Rich in Antioxidants:</strong> High concentration of EGCG and catechins that help fight free radicals",
      },
      {
        _id: "b2",
        description:
          "<strong>Supports Metabolism:</strong> Natural compounds may help boost metabolic rate and energy levels",
      },
      {
        _id: "b3",
        description:
          "<strong>Mental Alertness:</strong> Contains L-theanine which promotes calm focus and mental clarity",
      },
      {
        _id: "b4",
        description:
          "<strong>Heart Health:</strong> Regular consumption may support cardiovascular health",
      },
    ],
    precautions: [
      {
        _id: "p1",
        description:
          "<strong>Caffeine Content:</strong> Contains natural caffeine - limit intake if sensitive to caffeine",
      },
      {
        _id: "p2",
        description:
          "<strong>Pregnancy:</strong> Consult healthcare provider before consumption during pregnancy or breastfeeding",
      },
      {
        _id: "p3",
        description:
          "<strong>Iron Absorption:</strong> Avoid drinking with iron-rich meals as tannins may reduce iron absorption",
      },
    ],
    offers: [
      {
        code: "TEATIME20",
        discount: "20% off",
        minOrder: "₹1000",
      },
      {
        code: "NEWUSER",
        discount: "15% off",
        minOrder: "No minimum",
      },
      {
        code: "BULK30",
        discount: "30% off",
        minOrder: "₹2500",
      },
    ],
    usage:
      "Steep 1 teaspoon of tea leaves in hot water (80-85°C) for 2-3 minutes. Do not over-steep to avoid bitterness. Can be consumed 2-3 times daily. Best enjoyed between meals.",
    coupons: [
      { code: "SAVE20", discount: "20% off", minOrder: "₹999" },
      { code: "FIRST15", discount: "15% off", minOrder: "₹499" },
      { code: "BULK25", discount: "25% off", minOrder: "₹1999" },
    ],
  };

  const productData = {
    name: product?.name || dummyProduct.name,
    subtitle: product?.subtitle || dummyProduct.subtitle,
    brand: product?.brand || dummyProduct.brand,
    price: product?.price || dummyProduct.price,
    originalPrice: product?.originalPrice || dummyProduct.originalPrice,
    discount: product?.discount || dummyProduct.discount,
    rating: product?.rating || dummyProduct.rating,
    reviewCount: product?.reviewCount || dummyProduct.reviewCount,
    soldCount: product?.soldCount || dummyProduct.soldCount,
    availability: product?.availability || dummyProduct.availability,
    description: product?.description || dummyProduct.description,
    variants: dummyProduct.variants,
    features: product?.features || dummyProduct.features,
    ingredients: product?.ingredients || dummyProduct.ingredients,
    benefits: product?.benefits || dummyProduct.benefits,
    precautions: product?.precautions || dummyProduct.precautions,
    offers: product?.offers || dummyProduct.offers,
    usage: product?.usage || dummyProduct.usage,
    coupons: product?.coupons || dummyProduct.coupons,
  };

  const renderVariant = () => {
    switch (detailSettings.variant) {
      case "minimal":
        return <Variant1 productData={productData} />;
      case "premium":
        return <Variant2 productData={productData} />;
      case "accordion":
        return <Variant3 productData={productData} />;
      case "ecommerce":
        return <Variant4 productData={productData} />;
      case "detailed":
      case "ayurvedic":
        return (
          <Variant5 productData={productData} detailSettings={detailSettings} />
        );
      default:
        return <Variant1 productData={productData} />;
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
              <FileText size={20} className="text-green-600" />
            </div>
            Product Details
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
