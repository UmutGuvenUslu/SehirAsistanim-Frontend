function Modal({ code, setCode, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-lg font-semibold mb-4">E-posta Doğrulama</h2>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Mail adresinize gelen kod"
          className="border p-2 w-full mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">İptal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-purple-600 text-white rounded">Doğrula ve Kayıt Ol</button>
        </div>
      </div>
    </div>
  );
}

export default Modal