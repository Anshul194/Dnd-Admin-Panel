export default function Variant1({ productData }: { productData?: any }) {
  // Dummy data
  const dummyData = {
    idealFor: [
      "You need daily heart & circulation support",
      "You struggle with stress, anxiety & tiredness",
      "You want to boost digestion & immunity naturally",
      "You're looking for a natural, holistic wellness approach",
    ],
    consultDoctor: [
      "You have thyroid or severe autoimmune conditions",
      "You are pregnant or breastfeeding",
      "You are taking strong prescription medicines daily",
      "You have known allergies to any of the listed ingredients",
    ],
  };

  const targetAudience = productData?.targetAudience || dummyData;

  return (
    <div className="py-8 font-manrope">
      <h2 className="text-3xl font-bold text-center mb-10 text-veda-text-dark">
        Is this for me?
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Perfect for you */}
        <div className="border border-green-200 rounded-xl p-8 bg-white relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 left-0 w-2 h-full bg-veda-primary"></div>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-veda-text-dark">
            <span className="text-veda-primary text-3xl">✓</span>
            Perfect for you if...
          </h3>
          <ul className="space-y-4">
            {targetAudience.idealFor.map((item: string, index: number) => (
              <li key={index} className="flex items-start gap-4">
                <span className="text-veda-primary shrink-0 mt-0.5 text-xl font-bold">
                  ✓
                </span>
                <span className="text-gray-700 font-medium text-lg">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consult a doctor */}
        <div className="border border-orange-200 rounded-xl p-8 bg-orange-50 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 w-2 h-full bg-orange-400"></div>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
            <span className="text-orange-500 text-3xl">⚠</span>
            Consult a doctor if...
          </h3>
          <ul className="space-y-4">
            {targetAudience.consultDoctor.map(
              (item: string, index: number) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="text-orange-400 shrink-0 mt-0.5 text-xl">
                    ⚠
                  </span>
                  <span className="text-gray-700 text-lg">{item}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
