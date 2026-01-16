import { useState, useRef, useEffect } from "react";
import { Leaf, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

export default function Variant5({ productData }: { productData?: any }) {
  const [selectedPack, setSelectedPack] = useState(1);
  const [selectedImage, setSelectedImage] = useState<number>(-1);
  const [showFixedBar, setShowFixedBar] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const actionButtonsRef = useRef<HTMLDivElement>(null);

  // Reset selectedImage to 0 if it's out of bounds when images change
  useEffect(() => {
    if (productData?.images && productData.images.length > 0) {
      if (selectedImage >= productData.images.length) {
        setSelectedImage(0);
      }
    }
  }, [productData?.images?.length, selectedImage]);

  // Scroll handler for fixed bar
  useEffect(() => {
    const handleScroll = () => {
      if (actionButtonsRef.current) {
        const rect = actionButtonsRef.current.getBoundingClientRect();
        const isPastButtons = rect.bottom < 0;
        setShowFixedBar(isPastButtons);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get the main image to display
  const getMainImage = () => {
    // Try to get image from images array
    if (productData?.images && productData.images.length > 0) {
      const index = selectedImage >= 0 && selectedImage < productData.images.length ? selectedImage : 0;
      const image = productData.images[index];
      if (image?.url) {
        return image.url;
      }
    }
    
    // Fallback
    if (productData?.images?.[0]?.url) {
      return productData.images[0].url;
    }
    
    if (productData?.image) {
      return productData.image;
    }
    
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuCam2aSrkEcUNAJ8_gHB3qRWI8th42_xgAWp5vhBT_ScdPB27DqnClxHlM4E0pC4dYP8VHP-kGQzT00MibOUQl9ramX3gL4K4pKDvxoKDgpUbM0kchU8ZLXaLnBzb-lw--xSjx4p2_iFuFhnyzJNCeZWPrCiXpVNF2t3M38ArlLBlc5rFfj3tABsZq1CNzXe6QJkhLTKzsX0XY1TuoykMo2wjhmn_nsQxphdwTmQp-sFELGy-XRZZAif0hAhUCzhi-qAGv6nWuVoPN7";
  };

  const mainImage = getMainImage();

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 120;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Logic from Variant6 (Details)
  const pricingPacks = [
    {
      id: 0,
      label: "Trial Pack",
      name: "Pack of 1",
      price: "₹599",
      originalPrice: null,
      tag: null,
    },
    {
      id: 1,
      label: "1 Month Care",
      name: "Pack of 2",
      price: "₹1,099",
      originalPrice: "₹1,598",
      tag: "MOST LOVED",
    },
    {
      id: 2,
      label: "2 Months Care",
      name: "Pack of 4",
      price: "₹1,999",
      originalPrice: "₹3,196",
      tag: null,
    },
    {
      id: 3,
      label: "3 Months Care",
      name: "Pack of 6",
      price: "₹2,899",
      originalPrice: "₹4,794",
      tag: null,
    },
  ];

  const certifications = [
    { icon: "✓", text: "GMP Certified" },
    { icon: "💊", text: "AYUSH Approved" },
    { icon: "🍽️", text: "FSSAI" },
    { icon: "🐰", text: "Cruelty Free" },
  ];

  // Get price for display
  const getPrice = () => {
    const selectedPackData = pricingPacks.find(p => p.id === selectedPack);
    return selectedPackData?.price || "₹599";
  };

  return (
    <>
      {/* Fixed Bottom Bar */}
      {productData && showFixedBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={productData.images?.[0]?.url || productData.image || mainImage}
                alt={productData?.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {productData.name || "Product Name"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-gray-900">
                  {getPrice()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:flex block gap-2">
              <button
                className="greenOne text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 text-sm max-md:mb-2"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <button
                className="greenTwo text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm max-md:w-full"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full font-manrope">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Product Details (From Variant6) */}
          <div className="flex flex-col gap-6 z-10 text-veda-text-dark">
            {/* Certification Badge */}
            <div className="inline-flex items-center gap-2 bg-veda-primary/10 px-3 py-1 rounded-full w-fit">
              <span className="text-green-800 text-[18px]">✓</span>
              <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                Ayurveda Certified
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-veda-text-dark">
              {productData?.name || "Daily Heart + Stress Support"},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400">
                Ayurveda Style
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-veda-text-dark/80 font-medium max-w-lg">
              {productData?.shortDescription ||
                "9 traditional herbs, 2x daily dose, COD + Free delivery."}
              <br />
              <span className="text-sm text-veda-text-secondary mt-1 block">
                Backed by 8+ years of trust.
              </span>
            </p>

            {/* Pricing Packs */}
            <div className="w-full overflow-hidden">
              <div className="flex overflow-x-auto gap-4 py-4 px-1 hide-scrollbar snap-x">
                {pricingPacks.map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className={`snap-start flex-shrink-0 w-36 p-3 rounded-xl border text-left transition-all ${
                      selectedPack === pack.id
                        ? "border-2 border-veda-primary bg-veda-primary/5 text-veda-text-secondary relative shadow-md transform scale-105 origin-left"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-veda-primary hover:shadow-md"
                    }`}
                  >
                    {pack.tag && selectedPack === pack.id && (
                      <span className="absolute -top-3 right-2 text-[10px] font-bold bg-veda-primary text-veda-text-dark px-2 py-0.5 rounded-full shadow-sm">
                        {pack.tag}
                      </span>
                    )}
                    <span
                      className={`block text-xs font-semibold mb-1 ${
                        selectedPack === pack.id ? "text-green-700" : "text-gray-400"
                      }`}
                    >
                      {pack.label}
                    </span>
                    <span className="block text-lg font-bold text-veda-text-dark">
                      {pack.name}
                    </span>
                    <span
                      className={`block text-xs font-medium mt-1 ${
                        selectedPack === pack.id ? "text-green-700" : "text-veda-text-secondary"
                      }`}
                    >
                      {pack.price}{" "}
                      {pack.originalPrice && (
                        <span className="line-through opacity-60">
                          {pack.originalPrice}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="flex flex-wrap gap-4 py-2 opacity-80">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-white border border-gray-100 px-2 py-1 rounded shadow-sm"
                >
                  <span className="text-veda-primary text-[16px]">
                    {cert.icon}
                  </span>
                  <span className="text-xs font-bold">{cert.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div ref={actionButtonsRef}></div>
            <div className="flex flex-wrap gap-4 mt-2">
              <button className="flex-1 min-w-[160px] max-w-[240px] bg-veda-primary hover:bg-veda-primary/90 text-veda-text-dark font-bold h-12 rounded-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5">
                <span>🛒</span>
                Add to Cart
              </button>
              <button className="flex-1 min-w-[160px] max-w-[240px] bg-white border-2 border-gray-200 hover:border-veda-primary text-veda-text-dark font-bold h-12 rounded-lg flex items-center justify-center gap-2 transition-all">
                <span className="text-green-600">💬</span>
                Order on WhatsApp
              </button>
            </div>

            {/* Delivery Info */}
            <p className="text-xs text-gray-500 mt-[-10px]">
              ⚡️ Fast delivery within 3-5 days
            </p>
          </div>

          {/* Right Side: Image with Thumbnail Gallery */}
          <div className="relative flex flex-col gap-6">
            {/* Main Image */}
            <div className="relative flex justify-center lg:justify-end group">
              {/* Background blur effect */}
              <div className="absolute inset-0 bg-veda-primary/20 rounded-full filter blur-3xl opacity-30 transform translate-y-10 scale-90"></div>

              {/* Main image container */}
              <div className="relative z-10 w-full max-w-md">
                <div className="aspect-[4/5] w-full bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden relative flex items-center justify-center p-8">
                  <img
                    alt={productData?.name || "Product"}
                    className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
                    src={mainImage}
                  />

                  {/* Floating badge */}
                  <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full text-green-700">
                      <Leaf size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        100% Natural
                      </p>
                      <p className="text-[10px] text-gray-600 font-medium">
                        No added sugar
                      </p>
                    </div>
                  </div>

                  {/* Image counter on hover */}
                  {productData?.images && productData.images.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      {(selectedImage > -1 ? selectedImage + 1 : 1)} / {productData.images.length}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Thumbnails */}
            {productData?.images && productData.images.length > 0 && (
              <div className="relative flex items-center justify-center gap-2 max-w-md mx-auto lg:mx-0 lg:ml-auto">
                {/* Left Arrow */}
                <button
                  onClick={() => scroll("left")}
                  className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-700 z-10 transition-colors border border-gray-100 hidden sm:flex"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Scrollable Container */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
                >
                  {productData.images.map((img: any, index: number) => {
                    if (!img?.url) return null;
                    return (
                      <button
                        key={index}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden transition-all transform hover:scale-105 ${
                          selectedImage === index
                            ? "ring-4 ring-green-500 shadow-lg"
                            : "ring-2 ring-gray-200 hover:ring-gray-300"
                        }`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img
                          src={img.url}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === index && (
                          <div className="absolute inset-0 bg-green-500/20"></div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => scroll("right")}
                  className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-700 z-10 transition-colors border border-gray-100 hidden sm:flex"
                  aria-label="Scroll Right"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
