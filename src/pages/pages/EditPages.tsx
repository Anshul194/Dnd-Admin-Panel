import { use, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import CustomEditor from "../../components/common/TextEditor";
import {
  createPage,
  fetchPageById,
  updatePage,
} from "../../store/slices/pages";
import { useParams, useNavigate } from "react-router-dom";

function formatTimeRange(range?: string): [string, string] {
  if (!range || typeof range !== "string") return ["", ""];

  const parsePart = (part?: string) => {
    if (!part) return "";
    const p = part.trim().toLowerCase();
    // Match HH:MM and am/pm (with or without space)
    const m = p.match(/(\d{1,2}:\d{2})\s*(am|pm)/i);
    if (m) {
      const [, time, meridiem] = m as string[];
      const [hh, mm] = time.split(":");
      let hour = parseInt(hh, 10);
      if (meridiem === "pm" && hour !== 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;
      const hh24 = hour.toString().padStart(2, "0");
      return `${hh24}:${mm}`;
    }

    // Fallback: remove am/pm tokens and return trimmed value
    return p.replace(/(?:am|pm)/gi, "").trim();
  };

  const parts = range.split(/\s*-\s*/);
  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);
  return [start, end];
}

export default function EditPage() {
  const [page, setPage] = useState({
    mainTitle: "",

    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft" as "draft" | "published",
    showInFooter: false,
    redirectBySlug: false,
  });

  const [contactUsData, setContactUsData] = useState({
    email: "",
    phone: "",
    appointmentNote: "",
    contactHours: {
      monWedAM: "",
      thuFriAM: "",
      satAM: "",
      monWedPM: "",
      thuFriPM: "",
      satPM: "",
    },
  });

  const params = useParams();
  const navigate = useNavigate();
  const pageId = params.id || "";
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(
    (state: RootState) => state.page?.loading || false
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setPage({ ...page, [name]: checked });
    } else {
      setPage({ ...page, [name]: value });
    }
  };

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPage({
      ...page,
      title,
      slug: generateSlug(title),
      metaTitle: title, // Auto-populate meta title
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!page.title.trim()) {
      toast.error("Page title is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!page.slug.trim()) {
      toast.error("Page slug is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (!page.content.trim()) {
      toast.error("Page content is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }
    if (!page.mainTitle) {
      toast.error("Please select a section for the page.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    const pageData = {
      title: page.title.trim(),
      slug: page.slug.trim(),
      content: page.content,
      metaTitle: page.metaTitle.trim() || page.title.trim(),
      metaDescription: page.metaDescription.trim(),
      status: page.status,
      showInFooter: page.showInFooter,
      redirectBySlug: page.redirectBySlug,
    };

    if (page.mainTitle === "contact-us") {
      pageData.isContactPage = true;
      pageData.contactData = {
        email: contactUsData.email.trim(),
        phone: contactUsData.phone.trim(),
        appointmentNote: contactUsData.appointmentNote.trim(),
        contactHours: {
          monWed: `${contactUsData.contactHours.monWedAM}am - ${contactUsData.contactHours.monWedPM}pm`,
          thuFri: `${contactUsData.contactHours.thuFriAM}am - ${contactUsData.contactHours.thuFriPM}pm`,
          sat:
            contactUsData.contactHours.satAM !== "" &&
              contactUsData.contactHours.satPM !== ""
              ? `${contactUsData.contactHours.satAM}am - ${contactUsData.contactHours.satPM}pm`
              : "Closed",
        },
      };
    }

    try {
      const createdPage = await dispatch(
        updatePage({ id: pageId, data: pageData })
      ).unwrap();

      console.log("Updated Page:", createdPage);

      setPopup({
        isVisible: true,
        message: "Page updated successfully!",
        type: "success",
      });

      // Also show toast notification as backup
      toast.success("Page updated successfully!");

      // Redirect to pages list after successful update
      setTimeout(() => {
        navigate("/pages/list");
      }, 1000);
    } catch (err: any) {
      console.error("Error updating page:", err);
      const errorMessage =
        err?.message ||
        err?.response?.data?.body?.message ||
        err?.response?.data?.message ||
        "Failed to update page. Please try again.";

      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });

      // Also show toast notification as backup
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await dispatch(fetchPageById(pageId)).unwrap();
        console.log("Fetched Page Data:", response);
        setPage({
          mainTitle: response.mainTitle || "quick-links",
          title: response.title || "",
          slug: response.slug || "",
          content: response.content || "",
          metaTitle: response.metaTitle || response.title || "",
          metaDescription: response.metaDescription || "",
          status: response.status || "draft",
          showInFooter: response.showInFooter || false,
          redirectBySlug: response.redirectBySlug || false,
        });
        setContactUsData({
          email: response.contactData?.email || "",
          phone: response.contactData?.phone || "",
          appointmentNote: response.contactData?.appointmentNote || "",
          contactHours: {
            monWedAM:
              formatTimeRange(response.contactData?.contactHours?.monWed)[0] ||
              "",
            monWedPM:
              formatTimeRange(response.contactData?.contactHours?.monWed)[1] ||
              "",
            thuFriAM:
              formatTimeRange(response.contactData?.contactHours?.thuFri)[0] ||
              "",
            thuFriPM:
              formatTimeRange(response.contactData?.contactHours?.thuFri)[1] ||
              "",
            satAM:
              (response.contactData?.contactHours?.sat !== "Closed" &&
                formatTimeRange(response.contactData?.contactHours?.sat)[0]) ||
              "",
            satPM:
              (response.contactData?.contactHours?.sat !== "Closed" &&
                formatTimeRange(response.contactData?.contactHours?.sat)[1]) ||
              "",
          },
        });
        console.log("Contact Us Data:", {
          email: response.contactData?.email || "",
          phone: response.contactData?.phone || "",
          appointmentNote: response.contactData?.appointmentNote || "",
          contactHours: {
            monWedAM:
              formatTimeRange(response.contactData?.contactHours?.monWed)[0] ||
              "",
            monWedPM:
              formatTimeRange(response.contactData?.contactHours?.monWed)[1] ||
              "",
            thuFriAM:
              formatTimeRange(response.contactData?.contactHours?.thuFri)[0] ||
              "",
            thuFriPM:
              formatTimeRange(response.contactData?.contactHours?.thuFri)[1] ||
              "",
            satAM:
              (response.contactData?.contactHours?.sat !== "Closed" &&
                formatTimeRange(response.contactData?.contactHours?.sat)[0]) ||
              "",
            satPM:
              (response.contactData?.contactHours?.sat !== "Closed" &&
                formatTimeRange(response.contactData?.contactHours?.sat)[1]) ||
              "",
          },
        });
      } catch (error) {
        console.error("Error fetching page data:", error);
        setPopup({
          isVisible: true,
          message: "Failed to fetch page data.",
          type: "error",
        });
      }
    };
    getData();
  }, []);

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Add Page | TailAdmin"
        description="Add a new page for TailAdmin"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Add Page" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  name="section"
                  value={page.mainTitle}
                  onChange={(e) =>
                    setPage({ ...page, mainTitle: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="quick-links">Quick Links</option>
                  <option value="about-us">About Us</option>
                  <option value="client-care">Client Care</option>
                  <option value="contact-us">Contact Us</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={page.title}
                  onChange={handleTitleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter page title"
                  required
                />
              </div>

              <div>
                <div className="flex items-center gap-6 mb-2">
                  <div>
                    <label className="block  text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slug <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-center mt-1 space-x-2">
                    <input
                      type="checkbox"
                      id="redirectBySlug"
                      name="redirectBySlug"
                      checked={page.redirectBySlug}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                    />
                    <label
                      htmlFor="redirectBySlug"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Redirect by Slug
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  name="slug"
                  value={page.slug}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter page slug"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  URL-friendly version of the title. Auto-generated from title.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content <span className="text-red-500">*</span>
                </label>
                <CustomEditor
                  value={page.content}
                  onChange={(value) => setPage({ ...page, content: value })}
                />
              </div>
            </div>

            {page.mainTitle === "contact-us" && (
              <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Contact Information
                </h3>
                <div className=" grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="email"
                      value={contactUsData.email}
                      onChange={(e) =>
                        setContactUsData({
                          ...contactUsData,
                          email: e.target.value,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter Email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactUsData.phone}
                      onChange={(e) =>
                        setContactUsData({
                          ...contactUsData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter Phone Number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Appointment Note <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="appointmentNote"
                      value={contactUsData.appointmentNote}
                      onChange={(e) =>
                        setContactUsData({
                          ...contactUsData,
                          appointmentNote: e.target.value,
                        })
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Enter Appointment Note"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mon - Wed (AM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="phone"
                        value={contactUsData.contactHours.monWedAM}
                        onChange={(e) =>
                          setContactUsData({
                            ...contactUsData,
                            contactHours: {
                              ...contactUsData.contactHours,
                              monWedAM: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter Phone Number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mon - Wed (PM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="phone"
                        value={contactUsData.contactHours.monWedPM}
                        onChange={(e) =>
                          setContactUsData({
                            ...contactUsData,
                            contactHours: {
                              ...contactUsData.contactHours,
                              monWedPM: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter Phone Number"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Thu - Fri (AM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="phone"
                        value={contactUsData.contactHours.thuFriAM}
                        onChange={(e) =>
                          setContactUsData({
                            ...contactUsData,
                            contactHours: {
                              ...contactUsData.contactHours,
                              thuFriAM: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter Phone Number"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Thu - Fri (PM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="phone"
                        value={contactUsData.contactHours.thuFriPM}
                        onChange={(e) =>
                          setContactUsData({
                            ...contactUsData,
                            contactHours: {
                              ...contactUsData.contactHours,
                              thuFriPM: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter Phone Number"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sat (AM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="phone"
                        value={contactUsData.contactHours.satAM}
                        onChange={(e) =>
                          setContactUsData({
                            ...contactUsData,
                            contactHours: {
                              ...contactUsData.contactHours,
                              satAM: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter Phone Number"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sat (PM) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="phone"
                        value={contactUsData.contactHours.satPM}
                        onChange={(e) =>
                          setContactUsData({
                            ...contactUsData,
                            contactHours: {
                              ...contactUsData.contactHours,
                              satPM: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        placeholder="Enter Phone Number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Meta Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                SEO Meta Information
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={page.metaTitle}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter meta title (for SEO)"
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recommended: 50-60 characters. Current:{" "}
                  {page.metaTitle.length}/60
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  value={page.metaDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter meta description (for SEO)"
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Recommended: 150-160 characters. Current:{" "}
                  {page.metaDescription.length}/160
                </p>
              </div>
            </div>

            {/* Page Settings Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Page Settings
              </h3>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={page.status}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Draft pages are not visible to visitors
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showInFooter"
                  name="showInFooter"
                  checked={page.showInFooter}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <label
                  htmlFor="showInFooter"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Show in Footer
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  Display this page link in the website footer
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Updating Page..." : "Update Page"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PopupAlert
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ ...popup, isVisible: false })}
      />
    </div>
  );
}
