import React, { useState } from "react";

function VirtualTryOn() {
  const [isIframeVisible, setIframeVisible] = useState(false);
  const sku = "SKU1212121"; // Replace with dynamic SKU if needed

  const handleButtonClick = () => {
    setIframeVisible(true); // Show the iframe when the button is clicked
  };

  return (
    <div className="container w-full">
      <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        Virtual Try-On
      </h1>

      <div className="flex justify-center mb-4">
        <button
          onClick={handleButtonClick}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
        >
          Open Virtual Try-On
        </button>
      </div>

      {isIframeVisible && (
        <div className="flex justify-center">
          <iframe
            src={`https://virtualtry.darjewellery.com/?sku=${sku}`}
            width="100%"
            height="800"
            frameBorder="0"
            title="Virtual Try-On"
            className="rounded-lg shadow-lg"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default VirtualTryOn;
