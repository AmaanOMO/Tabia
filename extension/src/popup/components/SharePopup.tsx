import React from 'react';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  shareUrl: string;
}

export const SharePopup: React.FC<SharePopupProps> = ({ isOpen, onClose, sessionName, shareUrl }) => {
  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Show toast confirmation
      showToast('Session link copied!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      // Show toast confirmation
      showToast('Session link copied!');
    }
  };

  const showToast = (message: string) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-300 rounded-lg px-6 py-4 shadow-lg z-[9999] text-center';
    toast.innerHTML = `
      <div class="text-blue-600 font-medium">${message}</div>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Share Session</h3>
          <p className="text-sm text-gray-600">Tabia: Collaborate, Save & Organize Tabs</p>
        </div>

        {/* Session Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Session:</span> {sessionName}
          </p>
        </div>

        {/* Share URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share this link:
          </label>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              copyToClipboard();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};
