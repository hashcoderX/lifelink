"use client";

import dynamic from 'next/dynamic';
import { useMemo, useEffect, useState } from 'react';
import Quill from 'quill';
import 'react-quill/dist/quill.snow.css';

// Defer registering image resize until client mount to avoid SSR/double-load issues
let imageResizeRegistered = false as boolean;

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className = ""
}) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      if (typeof window === 'undefined') return;
      if (!imageResizeRegistered) {
        try {
          const mod = await import('quill-image-resize-module');
          const ImageResize: any = (mod as any).default ?? mod;
          if (ImageResize) {
            (Quill as any).register('modules/imageResize', ImageResize);
            imageResizeRegistered = true;
          }
        } catch (e) {
          // If module fails to load, we continue without image resize
          console.warn('Failed to load quill-image-resize-module', e);
        }
      }
      if (!cancelled) setReady(true);
    }
    setup();
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    // Only include imageResize when it's actually registered to avoid constructor errors
    ...(imageResizeRegistered
      ? {
          imageResize: {
            parchment: Quill.import('parchment'),
            modules: ['Resize', 'DisplaySize']
          } as any,
        }
      : {}),
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'script',
    'direction', 'color', 'background', 'align',
    'blockquote', 'code-block', 'link', 'image', 'video'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      {ready && (
        <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white dark:bg-slate-800"
        />
      )}
      <style jsx global>{`
        .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          background: white;
        }
        .dark .ql-toolbar {
          border-color: rgb(51 65 85);
          background: rgb(30 41 59);
        }
        .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-top: none;
          min-height: 200px;
        }
        .dark .ql-container {
          border-color: rgb(51 65 85);
          background: rgb(30 41 59);
        }
        .ql-editor {
          color: rgb(15 23 42);
          padding: 12px 15px;
        }
        .dark .ql-editor {
          color: rgb(241 245 249);
        }
        .ql-editor.ql-blank::before {
          color: rgb(100 116 139);
        }
        .dark .ql-editor.ql-blank::before {
          color: rgb(100 116 139);
        }
        .ql-toolbar .ql-picker-label {
          color: rgb(15 23 42);
        }
        .dark .ql-toolbar .ql-picker-label {
          color: rgb(241 245 249);
        }
        .ql-toolbar button {
          color: rgb(15 23 42);
        }
        .dark .ql-toolbar button {
          color: rgb(241 245 249);
        }
        .ql-toolbar button:hover {
          background: rgb(241 245 249);
        }
        .dark .ql-toolbar button:hover {
          background: rgb(51 65 85);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;