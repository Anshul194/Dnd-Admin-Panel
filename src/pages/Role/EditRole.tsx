import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import toast, { Toaster } from "react-hot-toast";
import { AppDispatch, RootState } from "../../store";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PopupAlert from "../../components/popUpAlert";
import { fetchTenants } from "../../store/slices/tenant";
import { fetchModules } from "../../store/slices/moduleSlice";
import { fetchRoleById, updateRole } from "../../store/slices/roles";

interface ModulePermission {
  module: string;
  permissions: string[];
}

export default function EditRole() {
  const navigate = useNavigate();
  // Removed local user state
  const [role, setRole] = useState({
    name: "",
    scope: "global",
    tenantId: null as string | null,
    modulePermissions: [] as ModulePermission[],
  });
  const params = useParams();
  const roleId = params.id;
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.role.loading);
  const tenants = useSelector((state: RootState) => state.tenant.tenants);
  const modules = useSelector((state: RootState) => state.modules.modules);
  // Get user from Redux state
  const user = useSelector((state: RootState) => state.auth.user);

  // Available permissions
  const availablePermissions = ["create", "read", "update", "delete"];

  useEffect(() => {
    // Removed local storage user fetching

    // Fetch tenants and modules when component mounts
    dispatch(fetchModules());
    dispatch(fetchTenants());
  }, [dispatch]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "scope") {
      setRole({
        ...role,
        [name]: value,
        tenantId: value === "global" ? null : role.tenantId,
      });
    } else {
      setRole({ ...role, [name]: value });
    }
  };

  const handleModulePermissionChange = (
    moduleId: string,
    permission: string,
    checked: boolean
  ) => {
    setRole((prevRole) => {
      const updatedPermissions = [...prevRole.modulePermissions];
      const existingIndex = updatedPermissions.findIndex(
        (mp) => mp.module === moduleId
      );

      if (existingIndex >= 0) {
        // Module exists, update permissions
        const existingPermissions =
          updatedPermissions[existingIndex].permissions;
        if (checked) {
          // Add permission if not already present
          if (!existingPermissions.includes(permission)) {
            updatedPermissions[existingIndex].permissions = [
              ...existingPermissions,
              permission,
            ];
          }
        } else {
          // Remove permission
          updatedPermissions[existingIndex].permissions =
            existingPermissions.filter((p) => p !== permission);

          // Remove module entry if no permissions left
          if (updatedPermissions[existingIndex].permissions.length === 0) {
            updatedPermissions.splice(existingIndex, 1);
          }
        }
      } else if (checked) {
        // Module doesn't exist, create new entry
        updatedPermissions.push({
          module: moduleId,
          permissions: [permission],
        });
      }

      return {
        ...prevRole,
        modulePermissions: updatedPermissions,
      };
    });
  };

  const isPermissionChecked = (moduleId: string, permission: string) => {
    const modulePermission = role.modulePermissions.find(
      (mp) => mp.module === moduleId
    );
    return modulePermission?.permissions.includes(permission) || false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!role.name) {
      toast.error("Role name is required.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }

    if (role.scope === "tenant" && !role.tenantId) {
      toast.error("Tenant is required for tenant-scoped roles.", {
        duration: 8000,
        position: "top-right",
      });
      return;
    }



    try {
      // Prepare role data
      const roleData = {
        ...role,
        tenantId: role.scope === "global" ? null : role.tenantId,
      };

      // Update the role
      const updatedRole = await dispatch(
        updateRole({ id: roleId as string, data: roleData })
      ).unwrap();

      console.log("Updated Role:", updatedRole);

      setPopup({
        isVisible: true,
        message: "Role Updated successfully!",
        type: "success",
      });

      // Redirect to role list after a short delay
      setTimeout(() => {
        navigate("/roles/list");
      }, 1500);
    } catch (err: any) {
      setPopup({
        isVisible: true,
        message: "Failed to create role. Please try again.",
        type: "error",
      });
    }
  };

  const getData = async () => {
    if (!roleId) return; // Guard clause
    try {
      const response = await dispatch(fetchRoleById(roleId)).unwrap();
      console.log("Fetched Role Data:", response);

      // Handle potential nesting if not fully caught by thunk
      const roleData = response.result || response.role || response;

      let updatedRole = {
        name: roleData.name || "",
        scope: roleData.scope || "global",
        tenantId: roleData.tenantId || null,
        modulePermissions:
          roleData.modulePermissions?.map((mp: any) => ({
            module: mp.module,
            permissions: mp.permissions || [],
          })) || [],
      };

      // Only override if user is loaded and not superadmin. 
      // Ideally backend handles security, but keeping frontend logic for UI consistency.
      if (user && !user.isSuperAdmin) {
        updatedRole.scope = "tenant";
        updatedRole.tenantId = user?.tenant || null;
      }
      setRole(updatedRole);
    } catch (error) {
      console.error("Failed to fetch role data:", error);
      setPopup({
        isVisible: true,
        message: "Failed to fetch role data. Please try again.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    getData();
    // Removed dependency on 'user' to prevent blocking, though 'user' is used inside.
    // If 'user' loads LATER, we might want to re-run to force scope, but 
    // the initial fetch should happen regardless.
  }, [roleId, user]); // Kept user to re-evaluate scope restriction if user loads late
  return (
    <div>
      <Toaster position="top-right" />
      <PageMeta
        title="Edit Role | TailAdmin"
        description="Edit an existing role page for TailAdmin"
      />
      <div className="h-fit rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <PageBreadcrumb pageTitle="Edit Role" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={role.name}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    placeholder="Enter role name"
                    required
                  />
                </div>

                {user?.isSuperAdmin && (
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Scope <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="scope"
                      value={role.scope}
                      onChange={handleChange}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="global">Global</option>
                      <option value="tenant">Tenant</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Global roles apply across all tenants, tenant roles are
                      specific to one tenant
                    </p>
                  </div>
                )}
              </div>

              {role.scope === "tenant" && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tenant <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tenantId"
                    value={role.tenantId || ""}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    required={role.scope === "tenant"}
                    disabled={!user?.isSuperAdmin}
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant: any) => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.companyName} ({tenant.subdomain})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Module Permissions Section */}
            <div className="space-y-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Module Permissions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the permissions for each module that this role should
                have access to.
              </p>

              {modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((module: any) => (
                    <div
                      key={module._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white mb-3">
                        {module.name}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availablePermissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              checked={isPermissionChecked(
                                module._id,
                                permission
                              )}
                              onChange={(e) =>
                                handleModulePermissionChange(
                                  module._id,
                                  permission,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {permission}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No modules available. Please add modules first.</p>
                </div>
              )}
            </div>

            {/* Selected Permissions Summary */}
            {role.modulePermissions.length > 0 && (
              <div className="space-y-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Selected Permissions Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  {role.modulePermissions.map((mp, index) => {
                    const module = modules.find(
                      (m: any) => m._id === mp.module
                    );
                    return (
                      <div key={index} className="mb-2 last:mb-0">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {module?.name || mp.module}:
                        </span>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {mp.permissions.join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Updating ..." : "Update"}
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
