import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { fetchReviewById } from "../../../store/slices/reviewSlice";
import { Star, Heart } from "lucide-react";

const ImageUrl = import.meta.env.VITE_IMAGE_URL;

const ReviewDetails: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { selectedReview, loading, error } = useAppSelector((state) => state.review);

  useEffect(() => {
    if (id) dispatch(fetchReviewById(id));
  }, [id, dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg font-medium text-gray-600 dark:text-gray-300">Loading review data...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg font-semibold text-red-600 dark:text-red-400">{error}</div>
    </div>
  );

  if (!selectedReview) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg font-medium text-gray-600 dark:text-gray-300">No review found.</div>
    </div>
  );

  const review = selectedReview;
  const product = review.productId as any;
  const user = review.userId as any;

  return (
    <div className="h-fit rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] xl:px-12 xl:py-16">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header Section */}
        <div className="mb-12">
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-1 md:space-x-2">
              <li className="flex items-center">
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Home
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">•</span>
                  <a href="/reviews" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Reviews
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">Review Details</span>
                </div>
              </li>
            </ol>
          </nav>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Review Details
            </h1>
            <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
          </div>
        </div>

        {/* Product Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Product Information
            </h2>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
            {product && typeof product === 'object' ? (
              <div className="flex items-center gap-8">
                {product.thumbnail?.url && (
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <img
                        src={`${ImageUrl}/${product.thumbnail.url}`}
                        alt={product.thumbnail.alt || "Product"}
                        className="w-32 h-32 object-cover rounded-2xl shadow-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                    </div>
                  </div>
                )}
                <div className="flex-grow space-y-4">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                    {product.name || "Unknown Product"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {product.description || "No description available."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-red-500">
                <span className="text-xl font-bold">This product has been deleted.</span>
              </div>
            )}
          </div>
        </div>

        {/* Reviewer Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reviewer Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user?.name || "Not provided"}
                  readOnly
                  className="w-full text-lg font-medium text-gray-900 dark:text-white bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-600 pb-3 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user?.email || "Not provided"}
                  readOnly
                  className="w-full text-lg font-medium text-gray-900 dark:text-white bg-transparent border-0 border-b-2 border-gray-200 dark:border-gray-600 pb-3 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rating Score
              </label>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-yellow-500">{review.rating}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      <Star
                        className={`text-2xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        fill={i < review.rating ? "#facc15" : "none"}
                        strokeWidth={1.5}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </label>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${review.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-lg font-bold ${review.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {review.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Likes Received
              </label>
              <div className="flex items-center gap-3">
                <Heart className="text-2xl text-red-500" fill="#ef4444" strokeWidth={1.5} />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {review.likeCount || 0}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date Created
              </label>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {new Date(review.createdAt!).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                at {new Date(review.createdAt!).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Review Comment
            </label>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/30 rounded-2xl p-8 border-l-4 border-blue-500 shadow-inner">
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed italic">
                "{review.comment || "No comment provided by the reviewer."}"
              </p>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review Images
            </h2>
          </div>

          {review.images && review.images.length > 0 ? (
            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-400">
                {review.images.length} image{review.images.length > 1 ? 's' : ''} attached to this review
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {review.images.map((img, i) => (
                  <div key={i} className="group relative">
                    <div className="relative overflow-hidden rounded-2xl shadow-lg">
                      <img
                        src={`${ImageUrl}/${img}`}
                        alt={`Review image ${i + 1}`}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 px-2 py-1 rounded-md">
                          Image {i + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-900/50 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-600">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Images</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                The reviewer did not include any images with their review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetails;