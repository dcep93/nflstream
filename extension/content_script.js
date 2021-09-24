chrome.runtime.sendMessage(null, receive);

chrome.runtime.onMessage.addListener(receive);

function receive(message) {
  console.log("message", message);
  const div = document.getElementById("extension_message");
  div.value = JSON.stringify(message);
  div.click();
}
