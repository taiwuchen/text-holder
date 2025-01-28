import React, { useRef, useEffect, useState } from 'react';
import './App.css';

function App() {
  const contentRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isContentEmpty, setIsContentEmpty] = useState(true);

  useEffect(() => {
    // Load saved content
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

    // Modified text paste handling, make sure it does not adhere the style of the original text
    if (!isImagePasted) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
  
      // Insert paragraphs with line breaks
      const paragraphs = text.split('\n'); // Split text by newlines
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
  
      const range = selection.getRangeAt(0);
      range.deleteContents();
  
      paragraphs.forEach((paragraph, index) => {
        const textNode = document.createTextNode(paragraph);
        range.insertNode(textNode);
  
        // Add a <br> after each paragraph except the last one
        if (index < paragraphs.length - 1) {
          const br = document.createElement('br');
          range.insertNode(br);
        }
  
        // Update the range position
        range.setStartAfter(textNode);
      });
  
      // Move the cursor to the end
      selection.removeAllRanges();
      selection.addRange(range);
  
      handleInput();
    }
  };

  const insertImageOnNewLine = (src) => {
    // Create a new line before the image
    const brBefore = document.createElement('br');
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.classList.add('resizable');
    makeImageResizable(img);
    // Create a new line after the image
    const brAfter = document.createElement('br');

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    // Move the cursor to the end of the current line
    range.collapse(false);

    // Insert the line break, image, and another line break
    range.insertNode(brAfter);
    range.insertNode(img);
    range.insertNode(brBefore);

    // Move cursor after the image
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

  const saveContent = () => {
    const content = contentRef.current.innerHTML;
    localStorage.setItem('content', content);
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
      {/* Editor Wrapper */}
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
    </div>
  );
}

export default App;
