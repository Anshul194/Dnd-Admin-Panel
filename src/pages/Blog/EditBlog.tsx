import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles } from "lucide-react";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { createBlog, fetchBlogById, updateBlog } from "../../store/slices/blog";
import CustomEditor from "../../components/common/TextEditor";
import { useParams, useNavigate } from "react-router";
const Image_url = import.meta.env.VITE_IMAGE_URL;
interface BlogImage {
  file: File;
  alt: string;
}

export default function EditBlog() {
  const [blog, setBlog] = useState({
    title: "",
    content: "",
    slug: "",
    author: "",
    tags: [] as string[],
    thumbnail: null as File | null,
    thumbnailAlt: "",
  });

  const [images, setImages] = useState<BlogImage[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const params = useParams();
  const blogId = params.id;
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const loading = useSelector((state: RootState) => state.blog.loading);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setBlog({ ...blog, [name]: value });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBlog({ ...blog, thumbnail: e.target.files[0] });
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: BlogImage[] = [];
      Array.from(e.target.files).forEach((file) => {
        newImages.push({ file, alt: "" });
      });
      setImages([...images, ...newImages]);
    }
  };

  const updateImageAlt = (index: number, alt: string) => {
    const updatedImages = [...images];
    updatedImages[index].alt = alt;
    setImages(updatedImages);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  const addTag = () => {
    if (currentTag.trim() && !blog.tags.includes(currentTag.trim())) {
      setBlog({
        ...blog,
        tags: [...blog.tags, currentTag.trim()],
      });
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setBlog({
      ...blog,
      tags: blog.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blog.title) {
      toast.error("Blog title is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!blog.content) {
      toast.error("Blog content is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!blog.author) {
      toast.error("Author name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", blog.title);
    formData.append("slug", blog.slug);
    formData.append("content", blog.content);
    formData.append("author", blog.author);
    formData.append("tags", blog.tags);

    if (typeof blog.thumbnail !== "string" && blog.thumbnail) {
      formData.append("thumbnail[url]", blog.thumbnail);
      formData.append("thumbnail[alt]", blog.thumbnailAlt);
    }

    // Add multiple images with their alt texts
    images.forEach((image, index) => {
      if (typeof image.file === "string") return;
      formData.append(`images[${index}][url]`, image.file);
      formData.append(`images[${index}][alt]`, image.alt);
    });

    try {
      const updatedBlog = await dispatch(
        updateBlog({ id: blogId, data: formData })
      ).unwrap();

      console.log("Updated Blog:", updatedBlog);

      setPopup({
        isVisible: true,
        message: "Blog updated successfully!",
        type: "success",
      });
      
      // Also show toast notification as backup
      toast.success("Blog updated successfully!");

      // Redirect to blog list page after successful update
      setTimeout(() => {
        navigate("/blog/list");
      }, 1000);
    } catch (err: any) {
      const errorMessage = 
        err?.message || 
        err?.response?.data?.body?.message ||
        err?.response?.data?.message ||
        "Failed to update blog. Please try again.";
      
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
      
      // Also show toast notification as backup
      toast.error(errorMessage);
    }
  };

  const getImageUrl = (file: File | string) => {
    if (typeof file === "string") {
      return `${Image_url}/${file}`;
    }
    return URL.createObjectURL(file);
  };

  const getData = async () => {
    if (!blogId) {
      setPopup({
        isVisible: true,
        message: "Blog ID is missing from URL.",
        type: "error",
      });
      return;
    }
    
    try {
      const response = await dispatch(fetchBlogById(blogId)).unwrap();
      console.log("Fetched Blog Data:", response);
      
      // Handle different response structures
      const data = 
        response?.blog ||
        response?.data?.blog ||
        response?.data ||
        response;

      if (data && (data._id || data.title)) {
        setBlog({
          title: data?.title || "",
          slug: data?.slug || "",
          content: data?.content || "",
          author: data?.author || "",
          tags: Array.isArray(data?.tags) ? data.tags : [],
          thumbnail: data?.thumbnail?.url || data?.thumbnail || null,
          thumbnailAlt: data?.thumbnail?.alt || "",
        });
        
        const blogImages = data?.images?.map((img: any) => ({
          file: img?.url || img,
          alt: img?.alt || "",
        })) || [];
        setImages(blogImages);
      } else {
        setPopup({
          isVisible: true,
          message: "Invalid blog data received from server.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Error fetching blog data:", error);
      const errorMessage = 
        error?.message || 
        error?.response?.data?.body?.message ||
        error?.response?.data?.message ||
        "Failed to fetch blog data. Please check if the blog ID is valid.";
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta title="Edit Blog | TailAdmin" description="Edit an existing blog post page for TailAdmin" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-white dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900 px-5 py-7 xl:px-10 xl:py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Edit Blog
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update an existing blog post
            </p>
          </div>
        </div>

        {/* Inner content card (form kept unchanged) */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full">
            <PageBreadcrumb pageTitle="Edit Blog" />
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Basic Information
                </h3>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Blog Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={blog.title}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter blog title"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={blog.slug}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter blog slug"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={blog.author}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter author name"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content <span className="text-red-500">*</span>
                  </label>
                  {/* <textarea
                  name="content"
                  value={blog.content}
                  onChange={handleChange}
                  rows={8}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Write your blog content here..."
                  required
                /> */}
                  <CustomEditor
                    value={blog.content}
                    onChange={(value) => setBlog({ ...blog, content: value })}
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Tags
                </h3>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Add Tags
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter a tag and press Enter"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
                    >
                      Add
                    </button>
                  </div>

                  {blog.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {blog.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Images
                </h3>

                {/* Thumbnail */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thumbnail Image
                  </label>
                  <input
                    type="file"
                    onChange={handleThumbnailChange}
                    accept="image/*"
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  {blog.thumbnail && (
                    <div className="mt-3 space-y-2">
                      <img
                        src={getImageUrl(blog.thumbnail)}
                        alt="Thumbnail Preview"
                        className="max-w-xs h-auto rounded border"
                      />
                      <input
                        type="text"
                        name="thumbnailAlt"
                        value={blog.thumbnailAlt}
                        onChange={handleChange}
                        className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Thumbnail alt text"
                      />
                    </div>
                  )}
                </div>

                {/* Multiple Images */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Blog Images
                  </label>
                  <input
                    type="file"
                    onChange={handleImagesChange}
                    accept="image/*"
                    multiple
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />

                  {images.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded"
                        >
                          <img
                            src={getImageUrl(image.file)}
                            alt={`Preview ${index + 1}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={image.alt}
                              onChange={(e) =>
                                updateImageAlt(index, e.target.value)
                              }
                              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                              placeholder="Alt text for this image"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove Image
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Updating Blog..." : "Update Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <PopupAlert
          message={popup.message}
          type={popup.type}
          isVisible={popup.isVisible}
          onClose={() => {
            setPopup({ ...popup, isVisible: false });
            if (popup.type === "success") {
              navigate("/blog/list");
            }
          }}
        />
      </div>
    </div>
  );
}
