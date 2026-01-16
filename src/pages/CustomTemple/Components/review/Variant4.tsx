export default function Variant4({ productData }: { productData?: any }) {
  // Dummy reviews for when product doesn't have reviews
  const dummyReviews = [
    {
      name: "Priya Sharma",
      location: "Mumbai • Age 40-45",
      avatar: "https://via.placeholder.com/48",
      duration: "Used for 2 Months",
      review:
        "My energy levels were always low by afternoon. This juice has been a game changer. I feel lighter and my digestion has improved significantly. The taste is a bit strong but you get used to it.",
      verified: true,
    },
    {
      name: "Rajesh Kumar",
      location: "Delhi • Age 55+",
      avatar: "https://via.placeholder.com/48",
      duration: "Used for 4 Months",
      review:
        "I wanted a natural support for my heart health alongside my walking routine. I noticed my BP readings are more stable now. Excellent product packaging and delivery.",
      verified: true,
    },
    {
      name: "Anjali D.",
      location: "Bangalore • Age 30-35",
      avatar: "https://via.placeholder.com/48",
      duration: "Used for 3 Weeks",
      review:
        "Was skeptical about the taste, but it's earthy and manageable. The biggest change is my sleep quality. I feel much calmer dealing with work stress.",
      verified: true,
    },
  ];

  const reviews = productData?.reviews || dummyReviews;
  const rating = productData?.rating || 4.8;
  const totalReviews = productData?.totalReviews || "12,000+";

  return (
    <div className="py-8 font-manrope">
      <h2 className="text-3xl font-bold text-center mb-2 text-veda-text-dark">
        Real Stories
      </h2>
      <div className="flex justify-center mb-10 items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-2xl ${
              star <= Math.floor(rating)
                ? "text-yellow-400"
                : star - 0.5 <= rating
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          >
            {star <= Math.floor(rating)
              ? "★"
              : star - 0.5 <= rating
              ? "⯨"
              : "★"}
          </span>
        ))}
        <span className="text-sm font-medium ml-2 text-veda-text-secondary">
          {rating}/5 from {totalReviews} bottles sold
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((review: any, index: number) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 bg-gray-200 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: review.avatar
                    ? `url('${review.avatar}')`
                    : "url('https://via.placeholder.com/48')",
                }}
              ></div>
              <div>
                <p className="font-bold text-sm text-veda-text-dark">
                  {review.name}
                </p>
                <p className="text-xs text-veda-text-secondary">
                  {review.location}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">
                {review.duration}
              </span>
            </div>

            <p className="text-sm text-gray-700 italic flex-grow">
              &quot;{review.review}&quot;
            </p>

            {review.verified && (
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs font-bold text-green-700">
                ✓ Verified Buyer
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Also rated 4.4★ by 900+ buyers on Snapdeal & Amazon
        </p>
      </div>
    </div>
  );
}
