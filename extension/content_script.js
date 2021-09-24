chrome.runtime.sendMessage(null);

chrome.runtime.onMessage.addListener((message) => {
  const div = document.getElementById("extension_message");
  div.value = JSON.stringify(message);
  div.click();
});
