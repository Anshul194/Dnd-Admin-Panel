import Variant1 from "./Variant1";
import Variant2 from "./Variant2";
import Variant3 from "./Variant3";
import Variant4 from "./Variant4";

export function HowToUse({
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
  const howToUseSettings = {
    ...{
      showVideo: true,
      showSteps: true,
      span: component.span || 1,
      variant: "standard",
    },
    ...settings[component.id],
    variant: component.variant || settings[component.id]?.variant || "standard",
  };

  const dummyHowToUseData = {
    howToUseVideo: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    howToUseSteps: [
      {
        number: "01",
        title: "Get Started",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      },
      {
        number: "02",
        title: "Configure Settings",
        description:
          "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.",
      },
      {
        number: "03",
        title: "Launch & Monitor",
        description:
          "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      },
      {
        number: "04",
        title: "Optimize Results",
        description:
          "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.",
      },
    ],
  };

  const data = product || dummyHowToUseData;

  const renderVariant = () => {
    switch (howToUseSettings.variant) {
      case "minimal":
        return <Variant1 productData={data} />;
      case "detailed":
        return <Variant2 productData={data} />;
      case "standard":
        return <Variant3 productData={data} />;
      case "ayurvedic":
        return <Variant4 productData={data} />;
      default:
        return <Variant1 productData={data} />;
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
      {renderVariant()}
    </div>
  );
}
