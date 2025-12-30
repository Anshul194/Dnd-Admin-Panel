export interface OrderAddress {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export interface OrderItem {
  product: {
    $oid: string;
  };
  variant: {
    $oid: string;
  };
  quantity: number;
  price: number;
}

export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface OrderDetails {
  _id: {
    $oid: string;
  };
  user: {
    $oid: string;
  };
  items: OrderItem[];
  total: number;
  coupon?: {
    $oid: string;
  };
  discount?: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentDetails: PaymentDetails;
  deliveryOption:
    | "standard_delivery"
    | "express_delivery"
    | "same_day_delivery";
  placedAt: {
    $date: string;
  };
  createdAt: {
    $date: string;
  };
  updatedAt: {
    $date: string;
  };
  shippingMethod?: string;
  shipping_details?: {
    platform: string | null;
    reference_number: string | null;
    tracking_url: string | null;
    current_status: string | null;
    labelUrl: string | null;
    raw_response?: any;
    status_history?: any[];
  };
  __v: number;
}

export interface DeliveryOption {
  value: string;
  label: string;
  description: string;
  estimatedDays: string;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    value: "standard_delivery",
    label: "Standard Delivery",
    description: "Regular shipping service",
    estimatedDays: "5-7 business days",
  },
  {
    value: "express_delivery",
    label: "Express Delivery",
    description: "Faster shipping service",
    estimatedDays: "2-3 business days",
  },
  {
    value: "overnight_delivery",
    label: "Overnight Delivery",
    description: "Next day delivery",
    estimatedDays: "Next day",
  },
];

export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];
