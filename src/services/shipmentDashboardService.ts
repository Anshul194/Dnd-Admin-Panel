import axiosInstance from "./axiosConfig";

export interface ShipmentDashboardParams {
  platform: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export async function fetchShipmentDashboard(
  params: ShipmentDashboardParams,
  tenant: string
) {
  const { platform, from, to } = params;
  let url = `/orders/shipment/dashboard?from=${from}&to=${to}`;
  if (platform && platform !== "all") {
    url += `&platform=${encodeURIComponent(platform)}`;
  }
  const response = await axiosInstance.get(url, {
    headers: {
      "x-tenant": tenant,
    },
  });
  return response.data;
}
