import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
import { Button } from "./Button";

const BOX_WIDTH = 320;
const OUTPUT_MAX = 800;
const MAX_ZOOM = 3;

interface Position {
  x: number;
  y: number;
}

export function ImageCropModal({
  file,
  aspect,
  round = false,
  onCancel,
  onConfirm,
}: {
  file: File;
  aspect: number;
  round?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const boxHeight = Math.round(BOX_WIDTH / aspect);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origin: Position } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = useMemo(() => {
    if (!imgSize) return 1;
    return Math.max(BOX_WIDTH / imgSize.w, boxHeight / imgSize.h);
  }, [imgSize, boxHeight]);

  const dispW = imgSize ? imgSize.w * baseScale * zoom : 0;
  const dispH = imgSize ? imgSize.h * baseScale * zoom : 0;

  // Keeps the image's edge from being dragged past the crop box's edge in either direction,
  // so the frame never shows empty space beyond what was actually loaded.
  function clamp(x: number, y: number, w: number, h: number): Position {
    const minX = Math.min(0, BOX_WIDTH - w);
    const minY = Math.min(0, boxHeight - h);
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  function handleImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    const scale = Math.max(BOX_WIDTH / w, boxHeight / h);
    setImgSize({ w, h });
    setPos({ x: (BOX_WIDTH - w * scale) / 2, y: (boxHeight - h * scale) / 2 });
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!imgSize) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp(dragRef.current.origin.x + dx, dragRef.current.origin.y + dy, dispW, dispH));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(z: number) {
    if (!imgSize) return;
    const newDispW = imgSize.w * baseScale * z;
    const newDispH = imgSize.h * baseScale * z;
    // Anchor the zoom on the box center so the framed content doesn't jump around.
    const fx = dispW > 0 ? (BOX_WIDTH / 2 - pos.x) / dispW : 0.5;
    const fy = dispH > 0 ? (boxHeight / 2 - pos.y) / dispH : 0.5;
    setZoom(z);
    setPos(clamp(BOX_WIDTH / 2 - fx * newDispW, boxHeight / 2 - fy * newDispH, newDispW, newDispH));
  }

  async function handleConfirm() {
    if (!imgSize || !imageUrl) return;
    setIsSaving(true);
    try {
      // pos/zoom describe where the image sits on screen; drawImage instead needs the crop
      // rect in the original image's own pixel space, so this undoes the display scale and
      // flips the pan offset's sign to convert screen-space back to source-space.
      const scaleFactor = baseScale * zoom;
      const srcX = -pos.x / scaleFactor;
      const srcY = -pos.y / scaleFactor;
      const srcW = BOX_WIDTH / scaleFactor;
      const srcH = boxHeight / scaleFactor;

      const img = new Image();
      img.src = imageUrl;
      await img.decode();

      const outW = aspect >= 1 ? OUTPUT_MAX : Math.round(OUTPUT_MAX * aspect);
      const outH = aspect >= 1 ? Math.round(OUTPUT_MAX / aspect) : OUTPUT_MAX;
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not process image");
      const cropped = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
      onConfirm(cropped);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adjust image"
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-[var(--color-paper-raised)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Adjust image</h2>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden bg-black/10"
          style={{ width: BOX_WIDTH, height: boxHeight, borderRadius: round ? "9999px" : "0.75rem" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              className="absolute left-0 top-0 max-w-none cursor-grab active:cursor-grabbing"
              style={{
                width: dispW || undefined,
                height: dispH || undefined,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                visibility: imgSize ? "visible" : "hidden",
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--color-ink-soft)]">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            disabled={!imgSize}
            className="flex-1 accent-[var(--color-navy)]"
          />
        </div>
        <p className="-mt-2 text-center text-xs text-[var(--color-ink-soft)]">Drag the image to reposition it.</p>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} isLoading={isSaving} disabled={!imgSize} className="flex-1">
            Use photo
          </Button>
        </div>
      </div>
    </div>
  );
}
