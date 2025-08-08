export default function Modal({ children, onClose }) {
    return (
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl overflow-hidden max-w-sm w-full p-4 relative"
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-black"
            onClick={onClose}
          >✕</button>
          {children}
        </div>
      </div>
    );
  }
  