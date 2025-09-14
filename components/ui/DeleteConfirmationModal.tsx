"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  itemType: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>

        <div className="text-sm text-white/70 mb-4">
          <p className="mb-2">{description}</p>
          <p className="font-medium text-white">
            {itemType}: <span className="text-red-400">{itemName}</span>
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>This action cannot be undone.</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            loading={isLoading}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {itemType}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
