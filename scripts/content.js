const XCENSOR_BLUR_ATTR = 'xcensor-blur';
const XCENSOR_SAFE_ATTR = 'xcensor-safe';
const BTN_VIEW_BLUR_CLASS = 'view-blur-button';

function applyKeywordFilter() {
  chrome.storage.sync.get('blockedKeywords', function (data) {
    const keywords = data.blockedKeywords || [];
    const posts = document.querySelectorAll(`article:not([${XCENSOR_BLUR_ATTR}]):not([${XCENSOR_SAFE_ATTR}])`); // Avoid duplicate processing

    for (const post of posts) {
      const caption = post.querySelector('div[lang]');
      const postText = caption ? caption.innerText.toLowerCase() : '';

      const matchingKeywords = getMatchingKeywords(postText, keywords);
      const shouldBlur = matchingKeywords.length > 0 ;

      blurUnblurPost(shouldBlur, post, matchingKeywords);
    }
  });
}

function getMatchingKeywords(postText, keywords) {
  return keywords.filter(keyword => postText.includes(keyword.toLowerCase()));
}  

function blurUnblurPost(shouldBlur, post, matchingKeywords = []) {
  if (post) {
    post.style.filter = shouldBlur ? 'blur(25px)' : '';
  }

  if (shouldBlur && post) {
    setPostBlurAttribute('true', post);
    addViewButton(post, matchingKeywords); 
  } else if (!shouldBlur && post) {
    setPostSafeAttribute(post);
  }
}

function setPostBlurAttribute(showBlur, post) {
  post.setAttribute(XCENSOR_BLUR_ATTR, showBlur.toString());
}

function setPostSafeAttribute(post) {
  post.setAttribute(XCENSOR_SAFE_ATTR, 'true');
}

function addViewButton(post, matchingKeywords) {
  const parentDiv = post.parentElement;

  if (parentDiv.querySelector(`.${BTN_VIEW_BLUR_CLASS}`)) { // Avoid adding multiple buttons
    return;
  }

  const button = document.createElement('button');
  button.textContent = `Click To View - Blocked Keywords: ${matchingKeywords.join(', ')}`;
  button.className = BTN_VIEW_BLUR_CLASS;

  const parentPosition = parentDiv.style.position;
  const validPositions = ['relative', 'absolute', 'fixed'];
  
  if (!validPositions.includes(parentPosition)) { // Relative needs one of the valid positions to work as expected
    parentDiv.style.position = 'relative';
  }

  parentDiv.appendChild(button);

  button.addEventListener('click', function () {
    blurUnblurPost(false, post);
    button.remove();
  });
}

function clearProcessedPosts() {
  const posts = document.querySelectorAll('article');

  for (const post of posts) {
    post.removeAttribute(XCENSOR_BLUR_ATTR);
    post.removeAttribute(XCENSOR_SAFE_ATTR);

    const viewButton = post.parentElement.querySelector(`.${BTN_VIEW_BLUR_CLASS}`);
    
    if (viewButton) {
      viewButton.remove();
    }
  }
}

const observer = new MutationObserver(applyKeywordFilter); // MutationObserver modern way of listening for DOM changes
observer.observe( // Start observing
  document.body, // Target node
  {
    childList: true, // React to changes of child nodes eg. posts
    subtree: true // Monitor entire subtree since posts are nested
  }
);

applyKeywordFilter(); // Initial Call

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { // Listen for messages from the popup
  if (request.action === 'reapplyFilter') {
    clearProcessedPosts();
    applyKeywordFilter();
  }
});