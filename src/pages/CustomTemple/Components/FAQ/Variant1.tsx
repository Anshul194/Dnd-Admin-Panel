import { useState } from "react";

export default function Variant1({ productData }: { productData?: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Dummy FAQ data
  const dummyFAQs = [
    {
      question: "Is this a medicine?",
      answer:
        "No, this is an Ayurvedic nutritional supplement designed to support general wellness. It is not intended to treat or cure serious diseases. If you have a medical condition, please consult your doctor.",
    },
    {
      question: "How long does one bottle last?",
      answer:
        "Each bottle is 1 Litre. With the recommended dosage of 30ml twice a day (60ml total), one bottle will last approximately 15-16 days. We recommend the Pack of 2 for a full month's supply.",
    },
    {
      question: "Can I take this with my BP/Sugar medicines?",
      answer:
        "Generally, Ayurvedic herbs like Arjun and Amla are safe. However, maintain a gap of at least 1 hour between this juice and your allopathic medicines. Always consult your physician before starting.",
    },
    {
      question: "When will I see results?",
      answer:
        "Ayurveda works on the root cause and takes time. Most users report feeling better digestion and energy within 2-3 weeks. For significant changes in stress levels or health markers, consistent use for 3 months is recommended.",
    },
  ];

  const faqs = productData?.faqs || dummyFAQs;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-8 font-manrope">
      <h2 className="text-3xl font-bold text-center mb-10 text-veda-text-dark">
        Frequently Asked Questions
      </h2>

      <div className="space-y-4 max-w-3xl mx-auto">
        {faqs.map((faq: any, index: number) => (
          <div
            key={index}
            className={`group bg-gray-50 rounded-lg p-4 cursor-pointer border transition-all ${
              openIndex === index
                ? "border-gray-300 bg-white"
                : "border-transparent hover:bg-gray-100"
            }`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg pr-4 text-veda-text-dark">
                {faq.question}
              </h3>
              <span
                className={`text-gray-600 transition-transform duration-200 flex-shrink-0 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-96 mt-3" : "max-h-0"
              }`}
            >
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
