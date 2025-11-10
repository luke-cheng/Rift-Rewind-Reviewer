"use client";

import { useEffect } from "react";
import { View, Flex, Text, Button } from "@aws-amplify/ui-react";
import { useToast, type Toast } from "@/context/ToastContext";

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  const getToastStyles = () => {
    const baseStyles: React.CSSProperties = {
      padding: "12px 16px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      minWidth: "300px",
      maxWidth: "500px",
      animation: "slideIn 0.3s ease-out",
    };

    switch (toast.type) {
      case "success":
        return {
          ...baseStyles,
          backgroundColor: "var(--amplify-colors-green-10)",
          borderLeft: "4px solid var(--amplify-colors-green-80)",
          color: "var(--amplify-colors-green-100)",
        };
      case "error":
        return {
          ...baseStyles,
          backgroundColor: "var(--amplify-colors-red-10)",
          borderLeft: "4px solid var(--amplify-colors-red-80)",
          color: "var(--amplify-colors-red-100)",
        };
      case "warning":
        return {
          ...baseStyles,
          backgroundColor: "var(--amplify-colors-orange-10)",
          borderLeft: "4px solid var(--amplify-colors-orange-80)",
          color: "var(--amplify-colors-orange-100)",
        };
      case "info":
      default:
        return {
          ...baseStyles,
          backgroundColor: "var(--amplify-colors-blue-10)",
          borderLeft: "4px solid var(--amplify-colors-blue-80)",
          color: "var(--amplify-colors-blue-100)",
        };
    }
  };

  return (
    <View
      style={getToastStyles()}
      marginBottom="small"
      role="alert"
      aria-live="polite"
    >
      <Flex direction="row" justifyContent="space-between" alignItems="flex-start" gap="small">
        <Text flex="1" fontSize="medium" fontWeight="medium">
          {toast.message}
        </Text>
        <Button
          variation="link"
          size="small"
          onClick={() => removeToast(toast.id)}
          aria-label="Close notification"
          style={{
            padding: "0",
            minWidth: "auto",
            color: "inherit",
            opacity: 0.7,
          }}
        >
          ×
        </Button>
      </Flex>
    </View>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      position="fixed"
      top="20px"
      right="20px"
      zIndex={10000}
      style={{
        pointerEvents: "none",
      }}
    >
      <Flex direction="column" gap="small" style={{ pointerEvents: "auto" }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </Flex>
    </View>
  );
}

