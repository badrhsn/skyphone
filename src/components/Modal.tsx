"use client";

import React from "react";
import { Trash2, AlertCircle, Info, CheckCircle, X } from "lucide-react";

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'error' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export default function Modal({
  show,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmButtonClass
}: ModalProps) {
  if (!show) return null;

  const isConfirm = type === 'confirm';
  const showConfirmButton = onConfirm && isConfirm;

  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return <AlertCircle className="h-8 w-8 text-amber-600" />;
      case 'error':
        return <X className="h-8 w-8 text-red-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'info':
      default:
        return <Info className="h-8 w-8 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'confirm':
        return 'bg-amber-100';
      case 'error':
        return 'bg-red-100';
      case 'success':
        return 'bg-green-100';
      case 'info':
      default:
        return 'bg-blue-100';
    }
  };

  const getDefaultConfirmButtonClass = () => {
    switch (type) {
      case 'confirm':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <div className="text-center">
          <div className={`w-16 h-16 ${getIconBg()} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {getIcon()}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {title}
          </h3>
          <p className="text-gray-600 mb-8 whitespace-pre-line">
            {message}
          </p>
          <div className={`flex ${showConfirmButton ? 'space-x-4' : ''}`}>
            {showConfirmButton && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm || onClose}
              className={`${showConfirmButton ? 'flex-1' : 'w-full'} ${
                confirmButtonClass || getDefaultConfirmButtonClass()
              } text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy modal management
export function useModal() {
  const [modal, setModal] = React.useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'error' | 'success' | 'info';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (options: Omit<typeof modal, 'show'>) => {
    setModal({ ...options, show: true });
  };

  const hideModal = () => {
    setModal(prev => ({ ...prev, show: false }));
  };

  const showError = (title: string, message: string) => {
    showModal({ title, message, type: 'error' });
  };

  const showSuccess = (title: string, message: string) => {
    showModal({ title, message, type: 'success' });
  };

  const showInfo = (title: string, message: string) => {
    showModal({ title, message, type: 'info' });
  };

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    showModal({ 
      title, 
      message, 
      type: 'confirm', 
      onConfirm, 
      confirmText, 
      cancelText 
    });
  };

  return {
    modal,
    showModal,
    hideModal,
    showError,
    showSuccess,
    showInfo,
    showConfirm,
    ModalComponent: (
      <Modal
        show={modal.show}
        onClose={hideModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        confirmButtonClass={modal.confirmButtonClass}
      />
    )
  };
}