import { NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { useCallback, useRef, useEffect, useState } from "react";

const ResizableImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setDimensions({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  }, [node.attrs.src]);

  const lastWidthRef = useRef(100);
  const [displayWidth, setDisplayWidth] = useState(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    const img = imgRef.current;
    if (img) {
      startWidthRef.current = img.getBoundingClientRect().width;
      setDisplayWidth(startWidthRef.current);
    }
    const onMouseMove = (ev: MouseEvent) => {
      if (!imgRef.current) return;
      const diff = ev.clientX - startXRef.current;
      const newWidth = Math.max(80, startWidthRef.current + diff);
      lastWidthRef.current = newWidth;
      imgRef.current.style.maxWidth = `${newWidth}px`;
      setDisplayWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      updateAttributes({ style: `max-width: ${lastWidthRef.current}px; height: auto;` });
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [updateAttributes]);

  const style = node.attrs.style || "";

  return (
    <NodeViewWrapper className="relative inline-block" style={{ maxWidth: "100%" }}>
      <div className={`relative ${selected || isResizing ? "ring-2 ring-primary-400 rounded" : ""}`}>
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          style={{ maxWidth: "100%", height: "auto", display: "block", ...(style ? parseStyle(style) : {}) }}
          onLoad={() => {
            if (imgRef.current) {
              setDimensions({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
            }
          }}
        />
        {dimensions.w > 0 && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
            {displayWidth > 0 ? `${Math.round(displayWidth)}×${Math.round(displayWidth * dimensions.h / dimensions.w)}` : `${dimensions.w}×${dimensions.h}`}
          </div>
        )}
        {(selected || isResizing) && (
          <div
            className="absolute bottom-1 right-1 w-4 h-4 bg-primary-500 border-2 border-white rounded-sm cursor-se-resize hover:scale-110 transition-transform"
            onMouseDown={onMouseDown}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

function parseStyle(s: string): Record<string, string> {
  const obj: Record<string, string> = {};
  s.split(";").filter(Boolean).forEach(pair => {
    const [k, v] = pair.split(":").map(s => s.trim());
    if (k && v) obj[k] = v;
  });
  return obj;
}

export const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: { default: "" },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
