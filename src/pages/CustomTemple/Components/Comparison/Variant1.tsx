export default function Variant1({ productData }: { productData?: any }) {
  // Dummy comparison data matching code.html
  const dummyComparison = {
    title: "Deep Dive Comparison",
    subtitle:
      "See how VedaFlow's comprehensive blend stands out against single-herb supplements.",
    productName: "VedaFlow Juice",
    competitors: ["Single Herb Powder", "Conventional Tablets"],
    features: [
      {
        name: "Holistic Synergy",
        description:
          "Does it address multiple systems (Heart, Stress, Gut) simultaneously?",
        whyExcels:
          "Our 9-herb blend creates a compound effect where each herb amplifies the other.",
        ourProduct: {
          icon: "✓",
          label: "Complete Balance",
          status: "winner",
        },
        competitor1: {
          icon: "✗",
          label: "One-dimensional",
          status: "no",
        },
        competitor2: {
          icon: "✗",
          label: "Symptom specific",
          status: "no",
        },
      },
      {
        name: "Bio-availability",
        description:
          "How quickly and effectively does your body absorb the nutrients?",
        whyExcels:
          "Liquid extracts bypass the breakdown time required for solids.",
        ourProduct: {
          icon: "💧",
          label: "Rapid Absorption",
          status: "winner",
        },
        competitor1: {
          icon: "⏳",
          label: "Slow digestion",
          status: "partial",
        },
        competitor2: {
          icon: "🚫",
          label: "Binders delay uptake",
          status: "no",
        },
      },
      {
        name: "Gut & Immunity Bonus",
        description:
          "Does it actively support digestion while treating other issues?",
        whyExcels: "Includes Aloe & Amla specifically to heal the gut lining.",
        ourProduct: {
          icon: "✓",
          label: "Included",
          status: "winner",
        },
        competitor1: {
          icon: "✗",
          label: "Often causes heat/acidity",
          status: "no",
        },
        competitor2: {
          icon: "✗",
          label: "Can irritate stomach",
          status: "no",
        },
      },
    ],
  };

  const comparison = productData?.comparison || dummyComparison;

  return (
    <div className="py-8 font-manrope">
      <h2 className="text-3xl font-bold text-center mb-4 text-veda-text-dark">
        {comparison.title}
      </h2>
      <p className="text-center text-veda-text-secondary mb-12 max-w-2xl mx-auto">
        {comparison.subtitle}
      </p>

      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
        <table className="w-full text-center border-collapse min-w-[800px]">
          <thead className="bg-gray-50 text-veda-text-dark">
            <tr>
              <th className="p-6 text-left font-bold w-[30%] bg-white border-b-2 border-gray-100">
                <span className="text-lg">Comparison Features</span>
              </th>
              <th className="p-6 font-bold text-veda-primary bg-[#f0fdf4] border-t-4 border-veda-primary w-[25%] relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-veda-primary text-veda-text-dark text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  WINNER
                </div>
                <span className="text-xl">{comparison.productName}</span>
              </th>
              <th className="p-6 font-medium text-gray-500 w-[20%] border-b border-gray-100 bg-white">
                {comparison.competitors[0]}
              </th>
              <th className="p-6 font-medium text-gray-500 w-[25%] border-b border-gray-100 bg-white">
                {comparison.competitors[1]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {comparison.features.map((feature: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="p-6 text-left">
                  <p className="font-bold text-gray-800">{feature.name}</p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                  <p className="text-xs font-semibold text-veda-primary mt-2">
                    Why VedaFlow Excels: {feature.whyExcels}
                  </p>
                </td>
                <td className="p-6 bg-[#fcfefd]">
                  <span className="text-veda-primary text-4xl">
                    {feature.ourProduct.icon}
                  </span>
                  <p className="text-sm font-bold text-gray-700 mt-2">
                    {feature.ourProduct.label}
                  </p>
                </td>
                <td className="p-6">
                  <span
                    className={`text-3xl ${
                      feature.competitor1.status === "no"
                        ? "text-gray-300"
                        : "text-orange-300"
                    }`}
                  >
                    {feature.competitor1.icon}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    {feature.competitor1.label}
                  </p>
                </td>
                <td className="p-6">
                  <span
                    className={`text-3xl ${
                      feature.competitor2.status === "no"
                        ? "text-gray-300"
                        : "text-red-300"
                    }`}
                  >
                    {feature.competitor2.icon}
                  </span>
                  <p className="text-xs text-gray-400 mt-2">
                    {feature.competitor2.label}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
