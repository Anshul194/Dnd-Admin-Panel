import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React from "react";
import { lazy, Suspense, useState } from "react";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ScrollToTop } from "./components/common/ScrollToTop";

import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./store/slices/authslice";
import AddCategory from "./pages/category/AddCategory";
import CategoryList from "./pages/category/CategoryList";
import AddModule from "./pages/module/AddModule";
import ModuleList from "./pages/module/ModuleList";
import AddTenant from "./pages/Tenant/AddTenant";
import TenantList from "./pages/Tenant/TenantList";
import EditTenant from "./pages/Tenant/EditTenant";
import AddRole from "./pages/Role/AddRole";
import RoleList from "./pages/Role/RoleList";
import EditRole from "./pages/Role/EditRole";
import AddSubscriptionPlan from "./pages/plan/AddPlan";
import PlanList from "./pages/plan/PlanLIst";
import EditPlan from "./pages/plan/EditPlan";
import EditCategory from "./pages/category/EditCategory";
import AddSubcategory from "./pages/Subcategory/AddSubcategory";
import EditSubcategory from "./pages/Subcategory/EditSubcategory";
import SubcategoryList from "./pages/Subcategory/SubcategoryList";
import AddProduct from "./pages/products/AddProduct";
import AttributeList from "./pages/Attribute/AttributeList";
import AddAttribute from "./pages/Attribute/AddAttribute";
import EditAttribute from "./pages/Attribute/EditAttribute";
import VariantList from "./pages/Variant/VariantList";
import AddVariant from "./pages/Variant/AddVariant";
import EditVariantList from "./pages/Variant/EditVariantList";
import ProductList from "./pages/products/ProductLIst";
import EditProduct from "./pages/products/EditProduct";
import ProductPageBuilder from "./pages/CustomTemple/page";
import TemplateList from "./pages/CustomTemple/TempleteList";
import CertificateList from "./pages/certificates/CertificateList";
import AddCertificate from "./pages/certificates/AddCertificate";
import EditCertificate from "./pages/certificates/EditCertificate";
import CouponList from "./pages/coupons/CouponList";
import AddCoupon from "./pages/coupons/AddCoupon";
import AddBlog from "./pages/Blog/AddBlog";
import BlogList from "./pages/Blog/BlogList";
import EditBlog from "./pages/Blog/EditBlog";
import EditCoupon from "./pages/coupons/EditCoupon";
import AddPage from "./pages/pages/AddPages";
import PagesList from "./pages/pages/PagesList";
import EditPage from "./pages/pages/EditPages";
import AddShipping from "./pages/Shipping/AddShipping";
import ShippingList from "./pages/Shipping/ShippingList";
import EditShipping from "./pages/Shipping/EditShipping";
import AddCustomers from "./pages/Customers/AddCustomers";
import CustomersList from "./pages/Customers/CustomersList";
import EditCustomer from "./pages/Customers/EditCustomer";
import AddLead from "./pages/Lead/AddLead";
import LeadList from "./pages/Lead/LeadList";
import EditLead from "./pages/Lead/EditLead";
import LeadNotes from "./pages/Lead/LeadNotes";
import SupportTicketList from "./pages/SupportTicket/SupportTicketList";
import ContentList from "./pages/Content/ContentList";
import SupportTicketChat from "./pages/SupportTicket/SupportTicketChat";
import EmailTemplateList from "./pages/emailTemplate/emailTemplateList";
import EditEmailTemplate from "./pages/emailTemplate/EditEmailTemplate";
import FaqList from "./pages/FAQ/FaqList";
import AddFaq from "./pages/FAQ/AddFaq";
import EditFaq from "./pages/FAQ/EditFaq";
import AddBrand from "./pages/brand/AddBrand";
import BrandList from "./pages/brand/BrandList";
import EditBrand from "./pages/brand/EditBrand";
import ReviewList from "./pages/pages/review/ReviewList";
import ReviewDetails from "./pages/pages/review/ReviewDetails";
import AddStaff from "./pages/staff/AddStaff";
import StaffList from "./pages/staff/StaffList";
import EditStaff from "./pages/staff/EditStaff";
import ZoneList from "./pages/Shipping/ZoneList";
import CreateShippingZone from "./pages/Shipping/CreateShippingZone";
import EditZone from "./pages/Shipping/Editzone";
import IvrLogs from "./pages/Ivr/IvrLogs";
import IverLead from "./pages/Ivr/IverLead";
import BulkPincodeImport from "./pages/Shipping/BulkPincodeImport";
import SettingsList from "./pages/Settings/SettingsList";
import OrderList from "./pages/Orders/OrderList";
import EditOrder from "./pages/Orders/EditOrder";
import ShipmentDashboard from "./pages/Orders/ShipmentDashboard";
import ContactList from "./pages/pages/contact/ContactList";
import EditContact from "./pages/pages/contact/EditContact";
import ViewContact from "./pages/pages/contact/ViewContact";
import Analytics from "./pages/Dashboard/Analytics";
import LeadAnalytics from "./pages/Lead/LeadAnalytics";
import MetaAnalytics from "./pages/Analytics/MetaAnalytics";

// Lazy load pages

const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));
const UserProfiles = lazy(() => import("./pages/UserProfiles"));

const Calendar = lazy(() => import("./pages/Calendar"));

const AppLayout = lazy(() => import("./layout/AppLayout"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const TrackingList = lazy(
  () => import("./pages/trackinganalytics/TrackingList")
);

// Simple modal wrapper for SignIn
function SignInModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 32,
          minWidth: 350,
          boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <SignIn />
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [showSignIn, setShowSignIn] = useState(false);

  // Show popup if not authenticated and not on /signin or /signup
  // (You may want to refine this logic based on your routing needs)

  React.useEffect(() => {
    if (!isAuthenticated) {
      setShowSignIn(true);
    } else {
      setShowSignIn(false);
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
        <Routes>
          {/* Public Routes - Only accessible when NOT authenticated */}
          <Route
            path="/signin"
            element={
              !isAuthenticated ? <SignIn /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/signin"
            element={
              !isAuthenticated ? <SignIn /> : <Navigate to="/" replace />
            }
          />

          {/* Protected Routes - Only accessible when authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Analytics />} />
              {/* <Route index path="/analytics" element={<Analytics />} /> */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />

              {/* Category Management Routes */}
              <Route path="/category/add" element={<AddCategory />} />
              <Route path="/category/list" element={<CategoryList />} />
              <Route path="/category/edit/:id" element={<EditCategory />} />
              {/* Category Management Routes */}
              <Route path="/subcategory/add" element={<AddSubcategory />} />
              <Route path="/subcategory/list" element={<SubcategoryList />} />
              <Route
                path="/subcategory/edit/:id"
                element={<EditSubcategory />}
              />
              {/* Module Management Routes */}
              <Route path="/module/add" element={<AddModule />} />
              <Route path="/module/list" element={<ModuleList />} />

              {/* Module Management Routes */}
              <Route path="/tenant/add" element={<AddTenant />} />
              <Route path="/tenant/list" element={<TenantList />} />
              <Route path="/tenant/edit/:id" element={<EditTenant />} />

              {/* Products Management Routes */}
              <Route path="/product/add" element={<AddProduct />} />
              <Route path="/product/list" element={<ProductList />} />
              <Route path="/product/edit/:id" element={<EditProduct />} />

              {/* Role Management Routes */}
              <Route path="/roles/add" element={<AddRole />} />
              <Route path="/roles/list" element={<RoleList />} />
              <Route path="/roles/edit/:id" element={<EditRole />} />

              {/* Attribute Management Routes */}
              <Route path="/attribute/list" element={<AttributeList />} />
              <Route path="/attribute/add" element={<AddAttribute />} />
              <Route path="/attribute/edit/:id" element={<EditAttribute />} />

              {/* Variant Management Routes */}
              <Route path="/variant/list" element={<VariantList />} />
              <Route path="/variant/add" element={<AddVariant />} />
              <Route path="/variant/edit/:id" element={<EditVariantList />} />

              {/* Plan Management Routes */}
              <Route path="/plan/add" element={<AddSubscriptionPlan />} />
              <Route path="/plan/list" element={<PlanList />} />
              <Route path="/plan/edit/:id" element={<EditPlan />} />
              {/* Coupon & Promo Management Routes */}
              <Route path="/coupon&promo/list" element={<CouponList />} />
              <Route path="/coupon&promo/add" element={<AddCoupon />} />
              <Route path="/coupon&promo/edit/:id" element={<EditCoupon />} />
              {/* Customers Management Routes */}
              <Route path="/customers/add" element={<AddCustomers />} />
              <Route path="/customers/list" element={<CustomersList />} />
              <Route path="/customers/edit/:id" element={<EditCustomer />} />
              <Route path="/lead/analytics" element={<LeadAnalytics />} />
              <Route path="/meta/analytics" element={<MetaAnalytics />} />
              {/* Plan Management Routes */}
              <Route
                path="/custom-temple/add"
                element={<ProductPageBuilder />}
              />
              <Route path="/custom-temple/list" element={<TemplateList />} />
              {/* Blog Management Routes */}
              <Route path="/blog/add" element={<AddBlog />} />
              <Route path="/blog/list" element={<BlogList />} />
              <Route path="/blog/edit/:id" element={<EditBlog />} />

              {/* Certificate Routes */}
              <Route path="/certificate/add" element={<AddCertificate />} />
              <Route path="/certificate/list" element={<CertificateList />} />
              <Route
                path="/certificate/edit/:id"
                element={<EditCertificate />}
              />

              {/* Page Management Routes */}
              <Route path="/pages/add" element={<AddPage />} />
              <Route path="/pages/list" element={<PagesList />} />
              <Route path="/pages/edit/:id" element={<EditPage />} />

              {/* Lead */}
              {/* Add more routes as needed */}
              <Route path="/lead/add" element={<AddLead />} />
              <Route path="/lead/list" element={<LeadList />} />
              <Route path="/lead/edit/:id" element={<EditLead />} />
              <Route path="/lead/notes/:leadId" element={<LeadNotes />} />

              {/* Support Tickets */}
              <Route path="/tickets/list" element={<SupportTicketList />} />
              <Route
                path="/tickets/:ticketId/chat"
                element={<SupportTicketChat />}
              />

              {/* order management */}

              <Route path="/orders/list" element={<OrderList />} />
              <Route path="/orders/shipment-dashboard" element={<ShipmentDashboard />} />
              <Route path="/orders/:id" element={<EditOrder />} />

              {/* Page Management Routes */}

              <Route path="/shipping/add" element={<AddShipping />} />
              <Route path="/shipping/list" element={<ShippingList />} />
              <Route path="/shipping/edit/:id" element={<EditShipping />} />
              <Route path="/shipping/zone/list" element={<ZoneList />} />
              <Route
                path="/shipping/zone/create"
                element={<CreateShippingZone />}
              />
              <Route path="/shipping/zone/edit/:id" element={<EditZone />} />
              <Route
                path="/bulkpincodeimport/add"
                element={<BulkPincodeImport />}
              />

              {/* Content Management Routes */}

              <Route path="/contents/list" element={<ContentList />} />

              <Route path="/ivrlogs/list" element={<IvrLogs />} />
              <Route path="/ivrlogs/lead-list/:leadId" element={<IverLead />} />

              {/* Email Template Management Routes */}

              <Route
                path="/emailtemplate/list"
                element={<EmailTemplateList />}
              />
              <Route
                path="/email-template/edit/:id"
                element={<EditEmailTemplate />}
              />

              {/* Brand Management Routes */}
              <Route path="/brand/add" element={<AddBrand />} />
              <Route path="/brand/list" element={<BrandList />} />
              <Route path="/brand/edit/:id" element={<EditBrand />} />

              {/* faq */}
              <Route path="/faq/list" element={<FaqList />} />
              <Route path="/faq/add" element={<AddFaq />} />
              <Route path="/faq/edit/:id" element={<EditFaq />} />

              <Route path="/reviews/list" element={<ReviewList />} />
              <Route path="/reviews/:id" element={<ReviewDetails />} />

              {/* staff */}
              <Route path="/staff/add" element={<AddStaff />} />
              <Route path="/staff/list" element={<StaffList />} />
              <Route path="/staff/edit/:id" element={<EditStaff />} />

              {/* Contact management */}
              <Route path="/contactus/list" element={<ContactList />} />
              <Route path="/contact/view/:id" element={<ViewContact />} />
              {/* <Route path="/contact/edit/:id" element={<EditContact />} /> */}

              {/* Settings Management Route */}
              <Route path="/settings/list" element={<SettingsList />} />

              {/* Tracking Analytics */}
              <Route
                path="/trackinganalytics/list"
                element={<TrackingList />}
              />
            </Route>
          </Route>

          {/* Redirect unauthenticated users to signup instead of signin */}
          <Route
            path="*"
            element={
              !isAuthenticated ? (
                <Navigate to="/signup" replace />
              ) : (
                <NotFound />
              )
            }
          />
        </Routes>
        {/* SignIn Popup */}
        <SignInModal
          open={
            showSignIn &&
            window.location.pathname !== "/signin" &&
            window.location.pathname !== "/signup"
          }
          onClose={() => setShowSignIn(false)}
        />
      </Suspense>
    </Router>
  );
}
