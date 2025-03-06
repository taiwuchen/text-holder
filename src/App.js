import React, { useRef, useEffect, useState } from 'react';
import './App.css';

function App() {
  const contentRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [showSavedPages, setShowSavedPages] = useState(false);
  const [savedPages, setSavedPages] = useState([]);
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [currentPageId, setCurrentPageId] = useState(null);

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
    // Check if there's any content, including line breaks
    const isEmpty = contentRef.current.innerHTML.trim() === '' ||
                   (contentRef.current.innerHTML.trim().replace(/<br\s*\/?>/gi, '').trim() === '' &&
                    contentRef.current.querySelectorAll('img').length === 0);
    
    setIsContentEmpty(isEmpty);
    saveContent();
  };

  const handleBlur = () => {
    // Check if there's any content, including line breaks
    const isEmpty = contentRef.current.innerHTML.trim() === '' ||
                   (contentRef.current.innerHTML.trim().replace(/<br\s*\/?>/gi, '').trim() === '' &&
                    contentRef.current.querySelectorAll('img').length === 0);
    
    setIsContentEmpty(isEmpty);
  };

  // Saves the active page content under a persistent "content" key.
  const saveContent = () => {
    const content = contentRef.current.innerHTML;
    localStorage.setItem('content', content);
  };

  // Save function: saves the current page.
  // - If the page hasn't been saved (currentPageId null), it creates a new page.
  // - If it has been saved before, it updates that entry.
  const handleSavePage = () => {
    const currentContent = contentRef.current.innerHTML;
    let pages = localStorage.getItem('pages')
      ? JSON.parse(localStorage.getItem('pages'))
      : [];
    
    if (currentPageId) {
      pages = pages.map(page =>
        page.id === currentPageId ? { ...page, content: currentContent } : page
      );
    } else {
      const timestamp = new Date().getTime();
      const defaultTitle = 'Page ' + new Date(timestamp).toLocaleString();
      pages.unshift({ id: timestamp, content: currentContent, title: defaultTitle });
      setCurrentPageId(timestamp);
    }
    
    localStorage.setItem('pages', JSON.stringify(pages));
    alert('Page saved!');
  };

  // New function: creates a new page.
  // This clears the current content and resets tracking for currentPageId.
  const handleNewPage = () => {
    contentRef.current.innerHTML = '';
    localStorage.removeItem('content');
    setIsContentEmpty(true);
    setCurrentPageId(null);
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
    setCurrentPageId(page.id);
    setShowSavedPages(false);
  };

  const handleRenamePage = (pageId) => {
    const newName = window.prompt('Enter a new name for this page:');
    if (newName && newName.trim() !== '') {
      const pages = savedPages.map(page =>
        page.id === pageId ? { ...page, title: newName } : page
      );
      localStorage.setItem('pages', JSON.stringify(pages));
      setSavedPages(pages);
    }
  };

  const handleToggleSelectPage = (pageId, checked) => {
    if (checked) {
      setSelectedPageIds([...selectedPageIds, pageId]);
    } else {
      setSelectedPageIds(selectedPageIds.filter(id => id !== pageId));
    }
  };

  const handleDeleteSelectedPages = () => {
    const pages = savedPages.filter(page => !selectedPageIds.includes(page.id));
    localStorage.setItem('pages', JSON.stringify(pages));
    setSavedPages(pages);
    setSelectedPageIds([]);
  };

  const closeSavedPages = () => {
    setSelectedPageIds([]);
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
        <button onClick={handleSavePage}>Save</button>
        <button onClick={handleNewPage}>New</button>
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
      
      {/* Modal for Saved Pages in src/App.js */}
      {showSavedPages && (
        <div className="popup-overlay">
          <div className="popup" style={{ position: 'relative' }}>
            <button
              onClick={closeSavedPages}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                border: 'none',
                background: 'transparent',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#333',
              }}
              aria-label="Close"
            >
              ✖
            </button>
            <h2>Saved Pages</h2>
            {savedPages.length === 0 ? (
              <p>No saved pages available.</p>
            ) : (
              <>
                <ul>
                  {savedPages.map(page => (
                    <li
                        key={page.id}
                        className="saved-page"
                        style={{
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ marginRight: '10px' }}
                        onChange={(e) => handleToggleSelectPage(page.id, e.target.checked)}
                        checked={selectedPageIds.includes(page.id)}
                      />
                      <strong
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                        onClick={() => handleLoadPage(page)}
                      >
                        {page.title || 'Untitled'}
                      </strong>
                      <button
                        onClick={() => handleRenamePage(page.id)}
                        style={{
                          marginLeft: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        aria-label="Rename"
                      >
                        <img src="/rename-icon.png" alt="Rename" style={{ width: '16px', height: '16px' }} />
                      </button>
                    </li>
                  ))}
                </ul>
                {selectedPageIds.length > 0 && (
                  <button onClick={handleDeleteSelectedPages}>Delete Selected</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
