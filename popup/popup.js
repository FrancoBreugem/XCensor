let keywordInput, addKeywordButton, keywordList;

document.addEventListener('DOMContentLoaded', function () {
  keywordInput = document.getElementById('inp-keyword');
  addKeywordButton = document.getElementById('btn-add-keyword');
  keywordList = document.getElementById('lst-keyword');

  addKeywordButton.addEventListener('click', addKeyword);
  
  loadSavedKeywords();
});

function loadSavedKeywords() {
  chrome.storage.sync.get('blockedKeywords', function (data) {
    data.blockedKeywords.forEach(keyword => addKeywordToList(keyword));
  });
}

function addKeyword() {
  const keyword = keywordInput.value.trim();

  if (keyword) {
    chrome.storage.sync.get('blockedKeywords', function (data) {
      let blockedKeywords = data.blockedKeywords || [];
      blockedKeywords.push(keyword);

      chrome.storage.sync.set({ blockedKeywords: blockedKeywords }, function () {
        addKeywordToList(keyword);
        keywordInput.value = '';
        sendReapplyFilterMessage();
      });
    });
  }
}

function removeKeyword(keyword) {
  chrome.storage.sync.get('blockedKeywords', function (data) {
    let blockedKeywords = data.blockedKeywords || [];
    blockedKeywords = blockedKeywords.filter(item => item !== keyword);

    chrome.storage.sync.set({ blockedKeywords: blockedKeywords }, function () {
      const itemsArray = Array.from(keywordList.getElementsByTagName('li'));
      const removedItem = itemsArray.find(li => li.textContent.includes(keyword));

      if (removedItem) {
        keywordList.removeChild(removedItem);
      }

      sendReapplyFilterMessage();
    });
  });
}

function addKeywordToList(keyword) {
  const keywordSpan = document.createElement('li');
  keywordSpan.textContent = keyword;
  keywordSpan.className = 'txt-keyword';

  const removeButton = document.createElement('button');
  removeButton.textContent = '✖';
  removeButton.className = 'btn-remove-keyword';

  removeButton.addEventListener('click', function () {
    removeKeyword(keyword);
  });

  const li = document.createElement('li');
  li.className = 'lst-keyword-item';

  li.appendChild(keywordSpan);
  li.appendChild(removeButton);
  keywordList.appendChild(li);
}

function sendReapplyFilterMessage() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'reapplyFilter' });
  });
}