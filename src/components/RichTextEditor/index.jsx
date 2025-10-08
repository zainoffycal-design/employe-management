import React, { useMemo, useRef, useEffect, memo, useCallback } from "react";
import ReactQuill from "react-quill";
import "./RichTextEditor.scss";

const RichTextEditor = memo(({
  value,
  onChange,
  placeholder = "Enter description...",
  height = "120px",
  readOnly = false,
}) => {
  const quillRef = useRef(null);

  const addProtocol = (url) => {
    if (!url) return url;

    const hasProtocol = /^(https?|ftp|mailto):\/\//.test(url);
    if (hasProtocol) return url;

    const hasDomain = url.includes(".");
    return hasDomain ? `https://${url}` : url;
  };

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      const setupLinkHandler = () => {
        const toolbar = quill.getModule("toolbar");
        if (toolbar?.handlers?.link) {
          const originalLinkHandler = toolbar.handlers.link;
          toolbar.handlers.link = function (value) {
            if (value) {
              const correctedValue = addProtocol(value);
              originalLinkHandler.call(this, correctedValue);
            } else {
              originalLinkHandler.call(this, value);
            }
          };
        }
      };

      setTimeout(setupLinkHandler, 100);
    }
  }, []);

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  return (
    <div className="rich-text-editor" style={{ height: height }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ height: `calc(${height} - 42px)` }}
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
