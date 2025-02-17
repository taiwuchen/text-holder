import React, { useRef, useEffect, useState } from 'react';
import './App.css';

function App() {
  const contentRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [showSavedPages, setShowSavedPages] = useState(false);
  const [savedPages, setSavedPages] = useState([]);

  useEffect(() => {
    // Load saved content for the active page
    const savedContent = localStorage.getItem('content');
    if (savedContent) {
      contentRef.current.innerHTML = savedContent;
      setIsContentEmpty(
        contentRef.current.textContent.trim() === '' &&
          contentRef.current.querySelectorAll('img').length === 0
      );
    } else {
      setIsContentEmpty(true);
    }

    // Show popup if first visit
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowPopup(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const handlePaste = (event) => {
    const items = event.clipboardData.items;
    let isImagePasted = false;
  
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = function (e) {
          insertImageOnNewLine(e.target.result);
        };
        reader.readAsDataURL(file);
        isImagePasted = true;
        event.preventDefault();
      }
    }
    if (!isImagePasted) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      const paragraphs = text.split('\n');
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
  
      const range = selection.getRangeAt(0);
      range.deleteContents();
  
      paragraphs.forEach((paragraph, index) => {
        const textNode = document.createTextNode(paragraph);
        range.insertNode(textNode);
        if (index < paragraphs.length - 1) {
          const br = document.createElement('br');
          range.insertNode(br);
        }
        range.setStartAfter(textNode);
      });
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  const insertImageOnNewLine = (src) => {
    const brBefore = document.createElement('br');
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.classList.add('resizable');
    makeImageResizable(img);
    const brAfter = document.createElement('br');

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.collapse(false);
    range.insertNode(brAfter);
    range.insertNode(img);
    range.insertNode(brBefore);
    range.setStartAfter(brAfter);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput();
  };

  const makeImageResizable = (img) => {
    img.addEventListener('mousedown', initDrag, false);
    function initDrag(e) {
      e.preventDefault();
      document.addEventListener('mousemove', doDrag, false);
      document.addEventListener('mouseup', stopDrag, false);
    }
    function doDrag(e) {
      img.style.width = e.pageX - img.getBoundingClientRect().left + 'px';
    }
    function stopDrag() {
      document.removeEventListener('mousemove', doDrag, false);
      document.removeEventListener('mouseup', stopDrag, false);
      saveContent();
    }
  };

  const handleInput = () => {
    const contentText = contentRef.current.textContent.trim();
    if (contentText === '' && contentRef.current.querySelectorAll('img').length === 0) {
      setIsContentEmpty(true);
    } else {
      setIsContentEmpty(false);
    }
    saveContent();
  };

  const handleBlur = () => {
    const contentText = contentRef.current.textContent.trim();
    if (contentText === '' && contentRef.current.querySelectorAll('img').length === 0) {
      setIsContentEmpty(true);
    }
  };

  // Saves the active page content under a persistent "content" key
  const saveContent = () => {
    const content = contentRef.current.innerHTML;
    localStorage.setItem('content', content);
  };

  // Save the current page to "pages" and clear the active page,
  // without removing the previously saved pages.
  const handleSaveAndNewPage = () => {
    const currentContent = contentRef.current.innerHTML;
    const timestamp = new Date().getTime();
    const pages = localStorage.getItem('pages')
      ? JSON.parse(localStorage.getItem('pages'))
      : [];
    pages.push({ id: timestamp, content: currentContent });
    localStorage.setItem('pages', JSON.stringify(pages));

    // Clear the active page (the saved page remains in "pages")
    contentRef.current.innerHTML = '';
    localStorage.removeItem('content');
    setIsContentEmpty(true);
  };

  const handleShowSavedPages = () => {
    const pages = localStorage.getItem('pages')
      ? JSON.parse(localStorage.getItem('pages'))
      : [];
    setSavedPages(pages);
    setShowSavedPages(true);
  };

  const handleLoadPage = (page) => {
    contentRef.current.innerHTML = page.content;
    localStorage.setItem('content', page.content);
    setIsContentEmpty(
      contentRef.current.textContent.trim() === '' &&
        contentRef.current.querySelectorAll('img').length === 0
    );
    setShowSavedPages(false);
  };

  const closeSavedPages = () => {
    setShowSavedPages(false);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="app">
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Welcome to Text Holder!</h2>
            <p>
              Note: Your content is saved locally in your browser. Clearing your browser data will erase your content.
            </p>
            <button onClick={closePopup}>Get Started</button>
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: '10px', textAlign: 'right' }}>
        <button onClick={handleSaveAndNewPage}>Save &amp; New Page</button>
        <button onClick={handleShowSavedPages}>Saved Pages</button>
      </div>
      
      {/* Editor */}
      <div className="editor-wrapper">
        <div
          ref={contentRef}
          contentEditable
          onPaste={handlePaste}
          onInput={handleInput}
          onBlur={handleBlur}
          className="content-editable"
        ></div>
        {isContentEmpty && <div className="placeholder">Type or insert image here</div>}
      </div>
      
      {/* Modal for Saved Pages */}
      {showSavedPages && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Saved Pages</h2>
            {savedPages.length === 0 ? (
              <p>No saved pages available.</p>
            ) : (
              <ul>
                {savedPages.map((page) => (
                  <li key={page.id} style={{ marginBottom: '10px' }}>
                    <button onClick={() => handleLoadPage(page)}>
                      Load Page {new Date(page.id).toLocaleString()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={closeSavedPages}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;