export interface ErrorSuggestion {
  title: string;
  description: string;
  action?: {
    label: string;
    handler: () => void;
  };
  links?: Array<{
    label: string;
    url: string;
  }>;
}

export interface EnhancedError {
  code: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "connection"
    | "validation"
    | "permission"
    | "data"
    | "system"
    | "network";
  suggestions: ErrorSuggestion[];
  technicalDetails?: string;
  timestamp: Date;
}

// Common error patterns and their enhanced messages
export const ERROR_PATTERNS = {
  // Connection errors
  CONNECTION_REFUSED: {
    code: "CONNECTION_REFUSED",
    message: "Unable to connect to the database server",
    severity: "high" as const,
    category: "connection" as const,
    suggestions: [
      {
        title: "Check if the server is running",
        description:
          "Ensure the database server is started and listening on the specified port.",
      },
      {
        title: "Verify connection details",
        description:
          "Double-check the host, port, and database name in your configuration.",
      },
      {
        title: "Check firewall settings",
        description:
          "Make sure your firewall allows connections to the database port.",
      },
    ],
  },

  ACCESS_DENIED: {
    code: "ACCESS_DENIED",
    message: "Authentication failed - access denied",
    severity: "high" as const,
    category: "permission" as const,
    suggestions: [
      {
        title: "Verify credentials",
        description: "Check that your username and password are correct.",
      },
      {
        title: "Check user permissions",
        description:
          "Ensure the user has the necessary permissions to access the database.",
      },
      {
        title: "Reset password",
        description:
          "If you're unsure about the password, consider resetting it.",
      },
    ],
  },

  DATABASE_NOT_FOUND: {
    code: "DATABASE_NOT_FOUND",
    message: "The specified database does not exist",
    severity: "medium" as const,
    category: "connection" as const,
    suggestions: [
      {
        title: "Create the database",
        description: "Create the database using your database management tool.",
      },
      {
        title: "Check database name",
        description: "Verify that the database name is spelled correctly.",
      },
    ],
  },

  // Validation errors
  INVALID_FILE_FORMAT: {
    code: "INVALID_FILE_FORMAT",
    message: "The uploaded file format is not supported",
    severity: "medium" as const,
    category: "validation" as const,
    suggestions: [
      {
        title: "Check file format",
        description:
          "Ensure your file is in a supported format (CSV, JSON, SQL).",
      },
      {
        title: "Convert file format",
        description:
          "Use a file converter to change your file to a supported format.",
      },
    ],
  },

  MISSING_REQUIRED_FIELD: {
    code: "MISSING_REQUIRED_FIELD",
    message: "Required field is missing",
    severity: "medium" as const,
    category: "validation" as const,
    suggestions: [
      {
        title: "Fill in required fields",
        description:
          "Complete all required fields marked with an asterisk (*).",
      },
    ],
  },

  // API errors
  API_RATE_LIMIT: {
    code: "API_RATE_LIMIT",
    message: "API rate limit exceeded",
    severity: "medium" as const,
    category: "network" as const,
    suggestions: [
      {
        title: "Wait and retry",
        description:
          "Wait a few minutes before trying again to avoid rate limiting.",
      },
      {
        title: "Increase poll interval",
        description:
          "Configure a longer interval between API calls to reduce rate limiting.",
      },
      {
        title: "Contact API provider",
        description:
          "Consider requesting a higher rate limit from your API provider.",
      },
    ],
  },

  API_UNAUTHORIZED: {
    code: "API_UNAUTHORIZED",
    message: "API authentication failed",
    severity: "high" as const,
    category: "permission" as const,
    suggestions: [
      {
        title: "Check API key",
        description: "Verify that your API key is correct and has not expired.",
      },
      {
        title: "Check permissions",
        description:
          "Ensure your API key has the necessary permissions for this operation.",
      },
      {
        title: "Regenerate API key",
        description:
          "If the key is compromised, generate a new one from your API provider.",
      },
    ],
  },

  // Network errors
  NETWORK_TIMEOUT: {
    code: "NETWORK_TIMEOUT",
    message: "Request timed out",
    severity: "medium" as const,
    category: "network" as const,
    suggestions: [
      {
        title: "Check internet connection",
        description: "Verify that you have a stable internet connection.",
      },
      {
        title: "Increase timeout settings",
        description: "Configure longer timeout values for network requests.",
      },
      {
        title: "Try again later",
        description:
          "The server might be experiencing high load. Try again in a few minutes.",
      },
    ],
  },

  // System errors
  INSUFFICIENT_MEMORY: {
    code: "INSUFFICIENT_MEMORY",
    message: "Not enough memory to process the request",
    severity: "high" as const,
    category: "system" as const,
    suggestions: [
      {
        title: "Reduce data size",
        description: "Try processing smaller batches of data at a time.",
      },
      {
        title: "Close other applications",
        description: "Free up memory by closing unnecessary applications.",
      },
      {
        title: "Increase system memory",
        description:
          "Consider adding more RAM to your system for better performance.",
      },
    ],
  },

  DISK_SPACE_LOW: {
    code: "DISK_SPACE_LOW",
    message: "Insufficient disk space",
    severity: "high" as const,
    category: "system" as const,
    suggestions: [
      {
        title: "Free up disk space",
        description:
          "Delete unnecessary files or move them to external storage.",
      },
      {
        title: "Clean up old backups",
        description: "Remove old backup files that are no longer needed.",
      },
      {
        title: "Extend storage",
        description: "Consider adding more storage space to your system.",
      },
    ],
  },

  // Data errors
  DATA_CORRUPTION: {
    code: "DATA_CORRUPTION",
    message: "Data appears to be corrupted",
    severity: "critical" as const,
    category: "data" as const,
    suggestions: [
      {
        title: "Restore from backup",
        description: "Restore your data from a recent backup if available.",
      },
      {
        title: "Validate data source",
        description:
          "Check if the original data source is intact and accessible.",
      },
      {
        title: "Contact support",
        description:
          "If the issue persists, contact technical support for assistance.",
      },
    ],
  },

  SCHEMA_MISMATCH: {
    code: "SCHEMA_MISMATCH",
    message: "Data schema does not match expected format",
    severity: "medium" as const,
    category: "data" as const,
    suggestions: [
      {
        title: "Check data format",
        description:
          "Verify that your data matches the expected schema structure.",
      },
      {
        title: "Update schema mapping",
        description: "Configure field mappings to match your data structure.",
      },
      {
        title: "Transform data",
        description:
          "Use data transformation tools to convert data to the expected format.",
      },
    ],
  },
};

export function enhanceError(
  error: Error | string,
  context?: any
): EnhancedError {
  const errorMessage = typeof error === "string" ? error : error.message;
  const errorCode =
    typeof error === "string" ? "UNKNOWN" : (error as any).code || "UNKNOWN";

  // Try to match against known error patterns
  const matchedPattern = Object.values(ERROR_PATTERNS).find(
    (pattern) =>
      errorMessage.toLowerCase().includes(pattern.message.toLowerCase()) ||
      errorCode === pattern.code
  );

  if (matchedPattern) {
    return {
      ...matchedPattern,
      technicalDetails: typeof error === "object" ? error.stack : undefined,
      timestamp: new Date(),
    };
  }

  // Default enhanced error for unknown errors
  return {
    code: errorCode,
    message: errorMessage,
    severity: "medium",
    category: "system",
    suggestions: [
      {
        title: "Check system logs",
        description:
          "Review the system logs for more detailed error information.",
      },
      {
        title: "Try again",
        description: "Sometimes errors are temporary. Try the operation again.",
      },
      {
        title: "Contact support",
        description: "If the problem persists, contact technical support.",
      },
    ],
    technicalDetails: typeof error === "object" ? error.stack : undefined,
    timestamp: new Date(),
  };
}

export function getErrorIcon(severity: EnhancedError["severity"]) {
  switch (severity) {
    case "low":
      return "info";
    case "medium":
      return "warning";
    case "high":
      return "error";
    case "critical":
      return "critical";
    default:
      return "warning";
  }
}

export function getErrorColor(severity: EnhancedError["severity"]) {
  switch (severity) {
    case "low":
      return "blue";
    case "medium":
      return "yellow";
    case "high":
      return "red";
    case "critical":
      return "red";
    default:
      return "yellow";
  }
}
