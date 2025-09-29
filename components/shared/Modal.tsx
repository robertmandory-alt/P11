import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            id="modal-backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl m-4" // Increased max-width
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="flex items-center justify-between p-4 border-b rounded-t">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {title}
                    </h3>
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ms-auto inline-flex items-center"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        <span className="sr-only">بستن پنجره</span>
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
