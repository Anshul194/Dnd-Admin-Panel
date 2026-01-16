export const COMPONENT_TYPES = {
  IMAGES: "images",
  DETAILS: "details",
  DESCRIPTION: "description",
  FREQUENTLY_PURCHASED: "frequentlyPurchased",
  INGREDIENTS: "ingredients",
  COUPONS: "coupons",
  HOW_TO_USE: "howToUse",
  CUSTOMER_REVIEWS: "customerReviews",
  FAQ: "faq",
  TARGET_AUDIENCE: "targetAudience",
  BENEFITS: "benefits",
  COMPARISON: "comparison",
};

export const COMPONENT_VARIANTS = {
  [COMPONENT_TYPES.IMAGES]: {
    modern: {
      label: "Modern",
      description: "Clean modern design with hover effects",
    },
    variant2: {
      label: "Gallery",
      description: "Grid-based image gallery",
    },
    variant3: {
      label: "Showcase",
      description: "Premium showcase with detailed view",
    },
    variant4: {
      label: "Premium",
      description: "Premium showcase with detailed view",
    },
    ayurvedic: {
      label: "Ayurvedic",
      description: "Hero image with gradient background and floating badge",
    },
  },
  [COMPONENT_TYPES.DETAILS]: {
    minimal: {
      label: "Modern",
      description: "Professional clean layout",
    },
    premium: {
      label: "Premium",
      description: "Compact card-style layout",
    },
    accordion: {
      label: "Accordion",
      description: "Luxury showcase design",
    },
    ecommerce: {
      label: "E-commerce",
      description: "Optimized layout for online shopping",
    },
    detailed: {
      label: "Detailed",
      description: "Comprehensive detailed view with all information",
    },
    ayurvedic: {
      label: "Ayurvedic",
      description: "Hero details with pricing packs and certifications",
    },
  },
  [COMPONENT_TYPES.DESCRIPTION]: {
    layout: {
      label: "Layout",
      description: "Two-column layout with description and media",
    },
    compact: {
      label: "Compact",
      description: "Minimal single-column layout",
    },
    showcase: {
      label: "Showcase",
      description: "Full-width media showcase design",
    },
  },
  [COMPONENT_TYPES.FREQUENTLY_PURCHASED]: {
    grid: {
      label: "Grid",
      description: "Clean grid layout",
    },
  },
  [COMPONENT_TYPES.INGREDIENTS]: {
    scrolling: {
      label: "Scrolling",
      description: "Interactive scroll-based ingredient showcase",
    },
    modern: {
      label: "Modern",
      description: "Sleek modern ingredient display",
    },
    premium: {
      label: "Premium",
      description: "Luxury ingredient presentation",
    },
    ayurvedic: {
      label: "Ayurvedic",
      description: "Table layout with ingredient images and benefits",
    },
  },
  [COMPONENT_TYPES.COUPONS]: {
    slider: {
      label: "Slider",
      description: "Interactive coupon slider with selection",
    },
    grid: {
      label: "Grid",
      description: "Grid layout of available coupons",
    },
    compact: {
      label: "Compact",
      description: "Minimal coupon display",
    },
  },
  [COMPONENT_TYPES.HOW_TO_USE]: {
    standard: {
      label: "Standard",
      description: "Video with step-by-step instructions",
    },
    minimal: {
      label: "Minimal",
      description: "Clean layout with numbered steps",
    },
    detailed: {
      label: "Detailed",
      description: "Enhanced layout with rich descriptions",
    },
    ayurvedic: {
      label: "Ayurvedic",
      description: "Video with 3-step process and storage info",
    },
  },
  [COMPONENT_TYPES.CUSTOMER_REVIEWS]: {
    cards: {
      label: "Cards",
      description: "Individual review cards with ratings",
    },
    list: {
      label: "List",
      description: "Clean list layout with compact design",
    },
    testimonial: {
      label: "Testimonial",
      description: "Featured testimonial style layout",
    },
    ayurvedic: {
      label: "Ayurvedic",
      description: "Card-based testimonials with verified badges",
    },
  },
  [COMPONENT_TYPES.FAQ]: {
    accordion: {
      label: "Accordion",
      description: "Expandable FAQ items with smooth animations",
    },
  },
  [COMPONENT_TYPES.TARGET_AUDIENCE]: {
    split: {
      label: "Split",
      description: "Two-column layout showing ideal users vs. cautions",
    },
  },
  [COMPONENT_TYPES.BENEFITS]: {
    ayurvedic: {
      label: "Ayurvedic",
      description: "Alternating layout with detailed benefit cards",
    },
  },
  [COMPONENT_TYPES.COMPARISON]: {
    table: {
      label: "Table",
      description: "Feature comparison table with competitor analysis",
    },
  },
};

import { CustomerReviews } from "./Components/review";
import { FrequentlyPurchased } from "./Components/frequentlyPerchased";
import { Ingredients } from "./Components/Incredients";
import { ProductImages } from "./Components/ProductImages/Index";
import { ProductDetails } from "./Components/ProductDetail";
import { Description } from "./Components/description";
import { HowToUse } from "./Components/HowToUse";
import { Coupons } from "./Components/coupons";
import { FAQ } from "./Components/FAQ";
import { TargetAudience } from "./Components/TargetAudience";
import { Benefits } from "./Components/Benefits";
import { Comparison } from "./Components/Comparison";

export function ComponentRenderer({
  component,
  product,
  settings,
  onUpdateSettings,
  onUpdateSpan,
  totalColumns = 3,
  isPreviewMode = false,
  COMPONENT_SPANS,
}: {
  component: { id: string; type: string; span: number; variant: string };
  product: object;
  settings: object;
  onUpdateSettings: (componentId: string, newSettings: object) => void;
  onUpdateSpan: (componentId: string, newSpan: number) => void;
  totalColumns?: number;
  isPreviewMode?: boolean;
  COMPONENT_SPANS: { [key: string]: { value: number; label: string } };
}) {
  const isFullWidth = component.span === totalColumns;

  const commonProps = {
    component,
    product,
    settings,
    onUpdateSettings,
    onUpdateSpan,
    isFullWidth,
    isPreviewMode,
    COMPONENT_SPANS,
  };

  switch (component.type) {
    case COMPONENT_TYPES.IMAGES:
      return <ProductImages {...commonProps} />;
    case COMPONENT_TYPES.DETAILS:
      return <ProductDetails {...commonProps} />;
    case COMPONENT_TYPES.DESCRIPTION:
      return <Description {...commonProps} />;
    case COMPONENT_TYPES.COUPONS:
      return <Coupons {...commonProps} />;
    case COMPONENT_TYPES.FREQUENTLY_PURCHASED:
      return <FrequentlyPurchased {...commonProps} />;
    case COMPONENT_TYPES.INGREDIENTS:
      return <Ingredients {...commonProps} />;
    case COMPONENT_TYPES.HOW_TO_USE:
      return <HowToUse {...commonProps} />;
    case COMPONENT_TYPES.CUSTOMER_REVIEWS:
      return <CustomerReviews {...commonProps} />;
    case COMPONENT_TYPES.FAQ:
      return <FAQ {...commonProps} />;
    case COMPONENT_TYPES.TARGET_AUDIENCE:
      return <TargetAudience {...commonProps} />;
    case COMPONENT_TYPES.BENEFITS:
      return <Benefits {...commonProps} />;
    case COMPONENT_TYPES.COMPARISON:
      return <Comparison {...commonProps} />;
    default:
      return null;
  }
}
