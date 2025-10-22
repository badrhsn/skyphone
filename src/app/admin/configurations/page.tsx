"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  History
} from "lucide-react";
import Link from "next/link";
import AdminNavigation from "@/components/AdminNavigation";
import { useModal } from "@/components/Modal";

interface ApiConfig {
  id: string;
  provider: string;
  isActive: boolean;
  environment: string;
  createdAt: string;
  updatedAt: string;
  lastUsed: string | null;
  version: string;
  description: string | null;
}

interface ConfigFormData {
  provider: string;
  description: string;
  environment: string;
  configData: Record<string, string>;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string | null;
  userName: string | null;
  metadata: string | null;
  createdAt: string;
}

export default function AdminConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showConfirm, showSuccess, showError, ModalComponent } = useModal();
  
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ApiConfig | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"configs" | "audit">("configs");
  
  const [formData, setFormData] = useState<ConfigFormData>({
    provider: "",
    description: "",
    environment: "production",
    configData: {}
  });

  // Common provider templates
  const providerTemplates = {
    twilio: {
      accountSid: "",
      authToken: "",
      apiKey: "",
      apiSecret: "",
      phoneNumber: ""
    },
    stripe: {
      publishableKey: "",
      secretKey: "",
      webhookSecret: ""
    },
    google_oauth: {
      clientId: "",
      clientSecret: ""
    },
    telnyx: {
      apiKey: "",
      phoneNumber: "",
      connectionId: ""
    },
    vonage: {
      apiKey: "",
      apiSecret: "",
      phoneNumber: ""
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session) {
      const isAdmin = session?.user?.isAdmin || session?.user?.email === 'admin@yadaphone.com';
      if (!isAdmin) {
        router.push("/dashboard");
      } else {
        fetchConfigurations();
        fetchAuditLogs();
      }
    }
  }, [status, session, router]);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch("/api/admin/configurations");
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch("/api/admin/configurations/audit");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      const url = editingConfig 
        ? `/api/admin/configurations/${editingConfig.id}`
        : "/api/admin/configurations";
      
      const method = editingConfig ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccess(
          editingConfig ? "Configuration Updated" : "Configuration Created",
          `${formData.provider} configuration has been ${editingConfig ? 'updated' : 'created'} successfully.`
        );
        setShowForm(false);
        setEditingConfig(null);
        setFormData({
          provider: "",
          description: "",
          environment: "production",
          configData: {}
        });
        fetchConfigurations();
        fetchAuditLogs();
      } else {
        const error = await response.json();
        showError("Operation Failed", error.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      showError("Operation Failed", "Failed to save configuration");
    }
  };

  const handleEditConfiguration = async (config: ApiConfig) => {
    try {
      const response = await fetch(`/api/admin/configurations/${config.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          provider: config.provider,
          description: config.description || "",
          environment: config.environment,
          configData: data.configData || {}
        });
        setEditingConfig(config);
        setShowForm(true);
      }
    } catch (error) {
      console.error("Error fetching configuration details:", error);
      showError("Error", "Failed to load configuration details");
    }
  };

  const handleDeleteConfiguration = (config: ApiConfig) => {
    showConfirm(
      "Delete Configuration",
      `Are you sure you want to delete the ${config.provider} configuration? This action cannot be undone.`,
      async () => {
        try {
          const response = await fetch(`/api/admin/configurations/${config.id}`, {
            method: "DELETE"
          });

          if (response.ok) {
            showSuccess("Configuration Deleted", `${config.provider} configuration has been deleted.`);
            fetchConfigurations();
            fetchAuditLogs();
          } else {
            const error = await response.json();
            showError("Delete Failed", error.error || "Failed to delete configuration");
          }
        } catch (error) {
          console.error("Error deleting configuration:", error);
          showError("Delete Failed", "Failed to delete configuration");
        }
      },
      "Delete",
      "Cancel"
    );
  };

  const handleToggleActive = async (config: ApiConfig) => {
    try {
      const response = await fetch(`/api/admin/configurations/${config.id}/toggle`, {
        method: "PATCH"
      });

      if (response.ok) {
        showSuccess(
          "Configuration Updated",
          `${config.provider} configuration has been ${config.isActive ? 'deactivated' : 'activated'}.`
        );
        fetchConfigurations();
        fetchAuditLogs();
      } else {
        const error = await response.json();
        showError("Update Failed", error.error || "Failed to update configuration");
      }
    } catch (error) {
      console.error("Error toggling configuration:", error);
      showError("Update Failed", "Failed to update configuration");
    }
  };

  const handleProviderChange = (provider: string) => {
    setFormData(prev => ({
      ...prev,
      provider,
      configData: providerTemplates[provider as keyof typeof providerTemplates] || {}
    }));
  };

  const handleConfigDataChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      configData: {
        ...prev.configData,
        [key]: value
      }
    }));
  };

  const togglePasswordVisibility = (configId: string, field: string) => {
    const key = `${configId}-${field}`;
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configurations...</p>
        </div>
      </div>
    );
  }

  const isAdmin = session?.user?.isAdmin || session?.user?.email === 'admin@yadaphone.com';
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700">
                <Settings className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">API Configuration Management</h1>
                <p className="text-gray-600">Securely manage all API credentials and configurations</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFormData({
                  provider: "",
                  description: "",
                  environment: "production",
                  configData: {}
                });
                setEditingConfig(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Configuration</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("configs")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "configs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Configurations ({configs.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "audit"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>Audit Trail ({auditLogs.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Content based on active tab */}
          {activeTab === "configs" && (
            <div className="space-y-4">
              {configs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first API configuration.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Configuration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {configs.map((config) => (
                    <div key={config.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${config.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Key className={`h-5 w-5 ${config.isActive ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 capitalize">
                              {config.provider.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-gray-500">{config.description || 'No description'}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                config.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {config.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {config.environment}
                              </span>
                              <span className="text-xs text-gray-500">
                                v{config.version}
                              </span>
                              {config.lastUsed && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Last used {new Date(config.lastUsed).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleActive(config)}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${
                              config.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {config.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleEditConfiguration(config)}
                            className="text-blue-600 hover:text-blue-700 p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteConfiguration(config)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Configuration Audit Trail</h3>
                <p className="text-sm text-gray-500">Track all configuration access and modifications</p>
              </div>
              <div className="divide-y divide-gray-200">
                {auditLogs.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <History className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No audit logs available</p>
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded-full ${
                            log.action === 'created' ? 'bg-green-100' :
                            log.action === 'updated' ? 'bg-blue-100' :
                            log.action === 'accessed' ? 'bg-gray-100' :
                            log.action === 'rotated' ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}>
                            {log.action === 'created' && <Plus className="h-3 w-3 text-green-600" />}
                            {log.action === 'updated' && <Edit2 className="h-3 w-3 text-blue-600" />}
                            {log.action === 'accessed' && <Eye className="h-3 w-3 text-gray-600" />}
                            {log.action === 'rotated' && <RotateCcw className="h-3 w-3 text-yellow-600" />}
                            {log.action === 'deleted' && <Trash2 className="h-3 w-3 text-red-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Configuration {log.action}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.userName ? `by ${log.userName}` : 'by system'} • {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
              </h3>
              
              <div className="space-y-4">
                {/* Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    disabled={!!editingConfig}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a provider</option>
                    <option value="twilio">Twilio</option>
                    <option value="stripe">Stripe</option>
                    <option value="google_oauth">Google OAuth</option>
                    <option value="telnyx">Telnyx</option>
                    <option value="vonage">Vonage</option>
                  </select>
                </div>

                {/* Environment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description for this configuration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Configuration Data */}
                {Object.keys(formData.configData).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Configuration Data</label>
                    <div className="space-y-3 border border-gray-200 rounded-md p-4">
                      {Object.entries(formData.configData).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords[`form-${key}`] ? "text" : "password"}
                              value={value}
                              onChange={(e) => handleConfigDataChange(key, e.target.value)}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Enter ${key}`}
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('form', key)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords[`form-${key}`] ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  disabled={!formData.provider || Object.keys(formData.configData).length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingConfig ? 'Update' : 'Create'} Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ModalComponent}
    </div>
  );
}