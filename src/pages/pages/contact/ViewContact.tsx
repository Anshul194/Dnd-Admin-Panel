import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../store";
import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PopupAlert from "../../../components/popUpAlert";
import {
  fetchContactById,
  updateContact,
} from "../../../store/slices/contactSlice";

export default function ViewContact() {
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: "",
    status: "new",
  });

  const [reply, setReply] = useState("");
  const [showReplySection, setShowReplySection] = useState(false);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const params = useParams();
  const id = params.id;
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(
    (state: RootState) => state.contact?.loading || false
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setContact({ ...contact, [name]: value });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!contact.name.trim()) {
      toast.error("Name is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!contact.email.trim()) {
      toast.error("Email is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!validateEmail(contact.email)) {
      toast.error("Please enter a valid email address.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!contact.message.trim()) {
      toast.error("Message is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    if (!contact.status) {
      toast.error("Status is required.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    const contactData = {
      name: contact.name.trim(),
      email: contact.email.trim().toLowerCase(),
      message: contact.message.trim(),
      status: contact.status,
    };

    try {
      const updatedContact = await dispatch(
        updateContact({ id, data: contactData })
      ).unwrap();

      console.log("Updated Contact:", updatedContact);

      setPopup({
        isVisible: true,
        message: "Contact updated successfully!",
        type: "success",
      });
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to update contact. Please try again.";
      setPopup({
        isVisible: true,
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim()) {
      toast.error("Reply message cannot be empty.", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    try {
      // You'll need to implement this API call to send email
      // This is a placeholder for the actual email sending logic
      console.log("Sending reply to:", contact.email);
      console.log("Reply message:", reply);

      toast.success("Reply sent successfully!", {
        duration: 4000,
        position: "top-right",
      });

      setReply("");
      setShowReplySection(false);

      // Optionally update status to 'read' after replying
      setContact({ ...contact, status: "read" });
    } catch (err: any) {
      toast.error("Failed to send reply. Please try again.", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  const getData = async () => {
    try {
      const response = await dispatch(fetchContactById(id)).unwrap();
      console.log("Fetched Contact:", response);
      setContact({
        name: response.name,
        email: response.email,
        message: response.message,
        status: response.status,
      });
    } catch (error) {
      console.error("Failed to fetch contact:", error);
      toast.error("Failed to load contact details.", {
        duration: 4000,
        position: "top-right",
      });
    }
  };
  const markasRead = async () => {
    try {
      const response = await dispatch(
        updateContact({
          id,
          data: {
            status: "read",
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to fetch contact:", error);
      toast.error("Failed to load contact details.", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  useEffect(() => {
    if (id) {
      getData();
      markasRead();
    }
  }, [dispatch, id]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "read":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="View Contact | TailAdmin"
        description="View contact details and send replies"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="View Contact" />

          {/* Status Badge */}
          {/* <div className="mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                contact.status
              )}`}
            >
              {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
            </span>
          </div> */}

          <form className="space-y-6">
            {/* Contact Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={contact.name}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={contact.email}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={contact.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
                  placeholder="Enter message"
                  required
                />
              </div>
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
