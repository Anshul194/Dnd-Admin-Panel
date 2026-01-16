import { useState } from "react";

export default function Variant1({ productData }: { productData?: any }) {
  // Dummy benefits data matching code.html structure
  const dummyBenefits = [
    {
      id: "heart",
      badge: {
        icon: "❤️",
        text: "Core Benefit",
        color: "red",
      },
      title: "Comprehensive Heart Support",
      description:
        "VedaFlow's core blend, featuring Arjun Chaal, is specifically formulated to support cardiovascular health. Arjun bark is renowned in Ayurveda for its ability to strengthen heart muscles, improve blood circulation, and help maintain healthy cholesterol levels.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlZnLSyHK1dt_EbBLlZC7UYBKU56xz5lTxwJLpnEq-qMItuW3nJAx5BDWki0dZlb-UlUjWqeu-ujev0I-atXSqEgI4vU_3bar_gF95kE9Cdzm9cImbmMKOnw8XbHej2SWwfTr2evUSQ_qAbBcHKiZyh1cN7NIeVEQjrSwokZ-jeYNk_4DSjkRj0jGH0dcgYr_GHGu1vI9ZLinUTcEhKLBBOWjr1IX59ZiwzWvrcywQpiKUavBQzP-jC5xdDOGpVP00iikAmA5LxpAm",
      imageLabel: "Target: Cardiovascular System",
      howItWorks: {
        title: "How it works",
        description:
          "The active compounds in Arjun Chaal work as a cardiac tonic, helping to tone the heart muscles and improve the pumping capacity of the heart.",
        points: [
          "Strengthens cardiac muscles naturally",
          "Maintains healthy cholesterol levels",
        ],
      },
    },
    {
      id: "stress",
      badge: {
        icon: "🧘",
        text: "Mental Wellness",
        color: "blue",
      },
      title: "Calm Mind, Stress Relief",
      description:
        "In today's fast-paced world, managing stress is crucial. Ashwagandha, a powerful adaptogen in VedaFlow, helps your body adapt to various stressors. It works by reducing cortisol levels, the primary stress hormone.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4CDGwBRBvGN0mspj071tmZck7922dNWpI84ajlOgaipZKUuGNuMYtHnbfWedElrgFrmFlheDn1yWosOtlvMgr-k-zoOaum9veARtHM3sobDJQT9IB2TzME7Al8iyr47LbcgGa3bOqWQPyWstcaVirqgSKjwhIUPDXvrtm2pT0mg4Ux-uxi-cBm0-b0uhsK8fdPsfIt_lMILAiN8NWEOQ3gYh9SE7zh9VGT9tdQ4SyFYDENhsyOFFWiF1cPA92-O8Ze5mYq5r63jIy",
      imageLabel: "Target: Nervous System",
      howItWorks: {
        title: "The Science of Calm",
        description:
          "Adaptogens like Ashwagandha modulate the release of stress hormones from the adrenal glands, helping to prevent the burnout feeling.",
        points: [
          "Significantly reduces Cortisol levels",
          "Promotes restful, deep sleep",
        ],
      },
    },
    {
      id: "immunity",
      badge: {
        icon: "🛡️",
        text: "Immunity Shield",
        color: "yellow",
      },
      title: "Digestion & Immunity",
      description:
        "A healthy gut is the foundation of overall wellness. VedaFlow incorporates Amla and Aloe Vera, two potent herbs known for their digestive and immune-boosting properties.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAI-qJWNH2NaQpTXf-HPfJhT4VmgpM-VDG5PhGnMKyALc0r1OU0erQBNoq2N9WrnPsEGxxrv9BSLni2YS-aKPtAIQpqfKaLFz9_qQhhiRa0tiGQ7O4BINBG4iMobVpdb1c0P-0wohPGpuo1_7olTzzmOGq2UzdWsMXVN0P9JC7F39JL6sGCFami9acZjcFpzEzf0eaiuTrJ9D4-sK4ZQX17NBbjfb5M794VM9cLZXNPulWHtNGPeXzLaJfg55w4MI4YuUTi1CbVvzSG",
      imageLabel: "Target: Gut Health",
      howItWorks: {
        title: "Natural Detox",
        description:
          "The high fiber content and natural enzymes help clear the digestive tract, ensuring nutrients are absorbed efficiently while toxins are flushed out.",
        points: [
          "Improves nutrient absorption",
          "Boosts natural immune defense",
        ],
      },
    },
    {
      id: "balance",
      badge: {
        icon: "⚖️",
        text: "Holistic Harmony",
        color: "purple",
      },
      title: "Better Daily Balance",
      description:
        "VedaFlow is more than just a sum of its parts; it's a synergistic blend designed to bring your entire system into harmony. The combination of 9 potent herbs works to balance your energy levels.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCCwRoHp6awBI9GY2uB7Yxe6j4ZP1SoBetIbh3-erx7DX0p5XD7WlSdP7_iBqOBMBSFuAlSiS-9IePLSHK1k1DWl0XGw-3NQTTl7dZoKntivS8EpZEk6N3IEz4QqKm3i9fhCI3BtvZK_YXuyNSr3FM7vlyS_6f3FV8khAhS23vCVPslXf-brpsAsxMdb7t7XNDvn-AyGtsoViIJ-P4tUUpVEMrRc5y_eWv-YuJSNQLVLUGyrcTbhuwfkDYUaWAo_UYQc3IGkfJTxlw",
      imageLabel: "Target: Whole Body",
      howItWorks: {
        title: "Sustained Energy",
        description:
          "Unlike caffeine which gives a spike and crash, these herbs provide a steady, sustained release of energy by optimizing cellular metabolism.",
        points: [
          "Stabilizes mood and energy",
          "Supports active lifestyle",
        ],
      },
    },
  ];

  const benefits = productData?.benefits || dummyBenefits;

  const getBadgeColor = (color: string) => {
    const colors: { [key: string]: string } = {
      red: "bg-red-100 text-red-700",
      blue: "bg-blue-100 text-blue-700",
      yellow: "bg-yellow-100 text-yellow-800",
      purple: "bg-purple-100 text-purple-700",
      green: "bg-green-100 text-green-700",
    };
    return colors[color] || colors.green;
  };

  const getImageBorderColor = (color: string) => {
    const colors: { [key: string]: string } = {
      red: "border-red-100",
      blue: "border-blue-100",
      yellow: "border-yellow-100",
      purple: "border-purple-100",
      green: "border-green-100",
    };
    return colors[color] || colors.green;
  };

  const getGradientColor = (color: string) => {
    const colors: { [key: string]: string } = {
      red: "from-red-50 to-pink-50",
      blue: "from-blue-50 to-indigo-50",
      yellow: "from-yellow-50 to-orange-50",
      purple: "from-purple-50 to-pink-50",
      green: "from-green-50 to-emerald-50",
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="py-8 font-manrope">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-4 text-veda-text-dark">
          Why our customers love it
        </h2>
        <p className="text-veda-text-secondary">
          Designed for holistic daily wellness support, not just symptom relief.
          Discover the detailed benefits below.
        </p>
      </div>

      <div className="space-y-24">
        {benefits.map((benefit: any, index: number) => (
          <div
            key={benefit.id || index}
            className={`grid lg:grid-cols-2 gap-12 items-center`}
          >
            {/* Image Section */}
            <div
              className={`relative group ${
                index % 2 === 0 ? "order-2 lg:order-1" : "order-2"
              }`}
            >
              <div
                className={`absolute -inset-4 bg-gradient-to-r ${getGradientColor(
                  benefit.badge.color
                )} rounded-2xl transform ${
                  index % 2 === 0 ? "-rotate-1" : "rotate-1"
                } group-hover:rotate-0 transition-transform`}
              ></div>
              <img
                alt={benefit.title}
                className="relative rounded-xl shadow-lg w-full object-cover h-[400px]"
                src={benefit.image}
              />
              <div
                className={`absolute bottom-4 ${
                  index % 2 === 0 ? "left-4" : "right-4"
                } bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border ${getImageBorderColor(
                  benefit.badge.color
                )}`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {benefit.imageLabel}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div
              className={`${
                index % 2 === 0 ? "order-1 lg:order-2" : "order-1"
              }`}
            >
              <div
                className={`inline-flex items-center gap-2 ${getBadgeColor(
                  benefit.badge.color
                )} px-3 py-1 rounded-full mb-6`}
              >
                <span className="text-sm">{benefit.badge.icon}</span>
                <span className="text-xs font-bold uppercase">
                  {benefit.badge.text}
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-veda-text-dark">
                {benefit.title}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {benefit.description}
              </p>

              {benefit.howItWorks && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-veda-primary">🔬</span>{" "}
                    {benefit.howItWorks.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {benefit.howItWorks.description}
                  </p>
                  <ul className="space-y-3">
                    {benefit.howItWorks.points.map(
                      (point: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 text-sm font-medium text-gray-700"
                        >
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
                            ✓
                          </span>
                          {point}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
