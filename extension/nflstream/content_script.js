console.log("content_script");

function main(message) {
  console.log("main", message);
  const div = document.getElementById("message_extension");
  div.value = JSON.stringify(message);
  div.click();
}

chrome.runtime.onMessage.addListener(main);

chrome.runtime.sendMessage(null, main);
