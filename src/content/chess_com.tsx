// on cookies change
const cookies = document.cookie;
console.log("cookies", cookies);

chrome.runtime.sendMessage({ type: "CHESS_COOKIES", payload: cookies });
