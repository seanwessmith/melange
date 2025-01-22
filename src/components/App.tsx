import React from "react";

const Popup = () => {
  const handleOpenNewPage = () => {
    chrome.runtime.sendMessage(
      { type: "FROM_POPUP", payload: "Hello background!" },
      (response) => {
        console.log("Response from background:", response);
      }
    );
  };

  return (
    <div className="w-64 p-4">
      <div>
        <h1 className="text-lg">Melange</h1>
        <div className="space-y-4">
          <button onClick={handleOpenNewPage} className="w-full">
            Open New Page
          </button>

          {/* Add more popup content here */}
          <div className="text-sm text-gray-500">
            Click the button above to open a new page
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
