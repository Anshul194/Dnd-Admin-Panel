export const getTenantFromURL = () => {
  const hostname = window.location.hostname;

  // If this specific domain is used, default tenant to 'bharat'
  if (hostname.includes("bharatgramudyogsangh.com")) {
    return "bharat";
  }

  const tenant = hostname.split(".")[0];
  return tenant;
};
