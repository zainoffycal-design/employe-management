import React, { memo, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import "./RichTextEditor.scss";

const RichTextEditor = memo(({ value, onChange, placeholder = "Enter description...", height = "120px", readOnly = false }) => {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Link.configure({ openOnClick: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } })
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange && onChange(html);
    }
  }, [readOnly]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  return (
    <div className="rich-text-editor" style={{ '--rte-height': height }}>
      <div className="rte-toolbar">
        {!readOnly && editor && (
          <div className="rte-buttons">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}>B</button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}>I</button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline?.().run?.()} disabled>U</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''}>• List</button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''}>1. List</button>
            <button
              type="button"
              onClick={() => {
                const previousUrl = editor.getAttributes('link').href || '';
                const url = window.prompt('Enter URL', previousUrl);
                if (url === null) return;
                if (url === '') {
                  editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  return;
                }
                editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
              }}
              className={editor.isActive('link') ? 'active' : ''}
            >
              Link
            </button>
            <button type="button" onClick={() => editor.chain().focus().unsetLink().run()}>Unlink</button>
            <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
          </div>
        )}
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
