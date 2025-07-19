import { useEffect, useRef } from "react";

function Modal({ code, setCode, onConfirm, onCancel, loadingVerify }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    const handleEsc = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-white/10 border border-white/20 flex items-center justify-center z-50 animate-fadeIn">
      <div className="relative bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-2xl w-96 transform animate-scaleIn">
        {/* Kapanma Butonu */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
          E-posta Doğrulama
        </h2>

        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mail adresinize gelen kodu girin"
          className="border border-gray-300 p-3 w-full mb-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
        />

        <div className="flex justify-end space-x-3 mt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow transition duration-200 ease-in-out"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loadingVerify}
            className={`px-5 py-2 rounded-lg bg-orange-500 text-white flex items-center justify-center
              ${loadingVerify ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-600 hover:shadow-lg"} transition duration-200`}
          >
            {loadingVerify ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                ></path>
              </svg>
            ) : null}
            {loadingVerify ? "Doğrulanıyor..." : "Doğrula ve Kayıt Ol"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
