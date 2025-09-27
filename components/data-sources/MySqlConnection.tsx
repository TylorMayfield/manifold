"use client";

import React, { useState } from "react";
import {
  Database,
  Server,
  Key,
  Users,
  Settings,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { mySqlProvider } from "../../lib/services/MySqlProvider";
import { clientLogger } from "../../lib/utils/ClientLogger";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface MySqlConnectionProps {
  projectId: string;
  onConnectionComplete: (success: boolean, message: string) => void;
}

const MySqlConnection: React.FC<MySqlConnectionProps> = ({
  projectId,
  onConnectionComplete,
}) => {
  const [formData, setFormData] = useState({
    providerName: "",
    host: "",
    port: 3306,
    database: "",
    username: "",
    password: "",
    tables: "",
    syncInterval: 60,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const testConnection = async () => {
    if (!formData.host || !formData.database || !formData.username) {
      setError("Please fill in host, database, and username");
      return;
    }

    try {
      setTestingConnection(true);
      setError(null);

      const config = {
        host: formData.host,
        port: formData.port,
        database: formData.database,
        username: formData.username,
        password: formData.password,
        tables: formData.tables
          ? formData.tables.split(",").map((t) => t.trim())
          : undefined,
        syncInterval: formData.syncInterval,
      };

      // Test the connection
      await mySqlProvider.testConnection(config);

      setConnectionTested(true);
      clientLogger.success(
        "MySQL connection test successful",
        "database",
        { host: formData.host, database: formData.database },
        "MySqlConnection"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setError(errorMessage);
      setConnectionTested(false);

      clientLogger.error(
        "MySQL connection test failed",
        "database",
        { error, host: formData.host, database: formData.database },
        "MySqlConnection"
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!formData.providerName.trim()) {
      setError("Please enter a provider name");
      return;
    }

    if (!connectionTested) {
      setError("Please test the connection first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const config = {
        host: formData.host,
        port: formData.port,
        database: formData.database,
        username: formData.username,
        password: formData.password,
        tables: formData.tables
          ? formData.tables.split(",").map((t) => t.trim())
          : undefined,
        syncInterval: formData.syncInterval,
      };

      const provider = await mySqlProvider.createMySqlProvider(
        projectId,
        formData.providerName,
        config
      );

      clientLogger.success(
        "MySQL provider created",
        "database",
        { providerId: provider.id, providerName: formData.providerName },
        "MySqlConnection"
      );

      onConnectionComplete(
        true,
        `MySQL provider "${formData.providerName}" created successfully!`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create provider";
      setError(errorMessage);
      onConnectionComplete(false, errorMessage);

      clientLogger.error(
        "Failed to create MySQL provider",
        "database",
        { error, projectId, providerName: formData.providerName },
        "MySqlConnection"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Database className="mx-auto h-12 w-12 text-white/60 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Connect to MySQL Database
        </h3>
        <p className="text-white/70 text-sm">
          Set up a live connection to sync data from your MySQL database
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {connectionTested && (
        <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span className="text-green-300 text-sm">
            Connection test successful!
          </span>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Provider Name"
          value={formData.providerName}
          onChange={(e) => handleInputChange("providerName", e.target.value)}
          placeholder="e.g., Production Database, Analytics DB"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Host"
            value={formData.host}
            onChange={(e) => handleInputChange("host", e.target.value)}
            placeholder="localhost"
            leftIcon={<Server className="h-4 w-4" />}
          />
          <Input
            label="Port"
            type="number"
            value={formData.port}
            onChange={(e) =>
              handleInputChange("port", parseInt(e.target.value) || 3306)
            }
            placeholder="3306"
          />
        </div>

        <Input
          label="Database Name"
          value={formData.database}
          onChange={(e) => handleInputChange("database", e.target.value)}
          placeholder="my_database"
          leftIcon={<Database className="h-4 w-4" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Username"
            value={formData.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            placeholder="root"
            leftIcon={<Users className="h-4 w-4" />}
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="••••••••"
            leftIcon={<Key className="h-4 w-4" />}
          />
        </div>

        <Input
          label="Tables to Sync (optional)"
          value={formData.tables}
          onChange={(e) => handleInputChange("tables", e.target.value)}
          placeholder="users, orders, products (leave empty to sync all)"
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Sync Interval (minutes)
          </label>
          <select
            value={formData.syncInterval}
            onChange={(e) =>
              handleInputChange("syncInterval", parseInt(e.target.value))
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={240}>4 hours</option>
            <option value={1440}>24 hours</option>
            <option value={0}>Manual only</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={testConnection}
          loading={testingConnection}
          disabled={!formData.host || !formData.database || !formData.username}
          variant="outline"
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Test Connection
        </Button>
        <Button
          onClick={handleCreateProvider}
          loading={loading}
          disabled={!connectionTested || !formData.providerName.trim()}
          className="flex-1"
        >
          <Database className="h-4 w-4 mr-2" />
          Create Provider
        </Button>
      </div>

      <div className="text-xs text-white/50 text-center">
        <p>
          Data will be synced to a local SQLite database for analysis. Changes
          can be tracked between syncs.
        </p>
      </div>
    </div>
  );
};

export default MySqlConnection;
