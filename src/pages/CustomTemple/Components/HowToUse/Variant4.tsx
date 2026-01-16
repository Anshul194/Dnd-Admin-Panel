export default function Variant4({ productData }: { productData?: any }) {
  // Dummy steps data matching code.html
  const dummySteps = [
    {
      number: 1,
      title: "Shake Well",
      description:
        "Natural herbs settle at the bottom. Shake the bottle vigorously before every use to ensure proper blend.",
      icon: "📳",
    },
    {
      number: 2,
      title: "Mix & Dilute",
      description:
        "Mix 25-30ml of juice with a glass (approx. 100-150ml) of room temperature water. Stir gently.",
      icon: "💧",
    },
    {
      number: 3,
      title: "Consume 2x Daily",
      description:
        "Drink on an empty stomach in the morning and 1 hour after dinner for optimal absorption.",
      icon: "⏰",
    },
  ];

  const steps = productData?.howToUseSteps || dummySteps;
  const videoTitle = productData?.howToUseTitle || "Watch: The Perfect Morning Ritual";
  const videoUrl = productData?.howToUseVideo || "";

  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    
    // Handle youtu.be format (e.g., https://youtu.be/S6Bw-O2ZJcA?si=...)
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle youtube.com/watch format
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Already embed format
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  // Extract plain text from HTML description
  const getPlainText = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  return (
    <div className="py-8 font-manrope">
      <h2 className="text-3xl font-bold text-center mb-10 text-veda-text-dark">
        How to Use
      </h2>

      {/* Video Section */}
      {embedUrl ? (
        <div className="mb-16 aspect-video w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative bg-black">
          <iframe
            src={embedUrl}
            title={videoTitle}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className="mb-16 aspect-video w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative group cursor-pointer bg-black">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:opacity-60 transition-opacity"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1599447332720-d4e474b8842f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`,
            }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-veda-primary/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-white ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white font-bold text-lg">
              {videoTitle}
            </p>
            <p className="text-gray-300 text-sm">
              A 2-minute guide to preparing your product
            </p>
          </div>
        </div>
      )}

      {/* Steps Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 relative">
        {/* Connecting line for desktop */}
        <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-gray-200 -z-10"></div>

        {steps.map((step: any, index: number) => (
          <div
            key={index}
            className="flex flex-col items-center text-center group bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="w-20 h-20 bg-white rounded-full border-2 border-dashed border-veda-primary flex items-center justify-center mb-4 group-hover:border-solid transition-all shadow-sm">
              <span className="text-4xl text-veda-primary">
                {step.icon || getStepIcon(index)}
              </span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-veda-text-dark">
              {step.number ? `${step.number}. ` : `${index + 1}. `}
              {step.title}
            </h3>
            <p className="text-sm text-gray-600">
              {getPlainText(step.description) || step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Storage Info */}
      <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-amber-600 shrink-0 text-2xl">📦</span>
        <div>
          <h4 className="font-bold text-amber-900 text-sm">
            Storage & Freshness
          </h4>
          <p className="text-xs text-amber-800 mt-1">
            Store in a cool, dry place away from direct sunlight. Once opened,
            keep refrigerated and consume within 25-30 days as it contains no
            strong artificial preservatives.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to get default icons for steps
function getStepIcon(index: number): string {
  const icons = ["📳", "💧", "⏰", "✅"];
  return icons[index] || "✓";
}
