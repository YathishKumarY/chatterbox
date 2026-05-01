import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

interface Props {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onClose: () => void;
}

function getCroppedImg(imageSrc: string, crop: Area, rotation: number): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const size = 400;
      canvas.width = size;
      canvas.height = size;

      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-size / 2, -size / 2);

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        size,
        size,
      );

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.src = imageSrc;
  });
}

export function ImageCropModal({ imageSrc, onCropComplete, onClose }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropDone = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedArea) return;
    setSaving(true);
    const result = await getCroppedImg(imageSrc, croppedArea, rotation);
    onCropComplete(result);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="bg-cb-surface rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-cb-border">
          <h3 className="font-medium text-cb-text-primary">Crop Photo</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-cb-surface-active">
            <X className="w-5 h-5 text-cb-text-secondary" />
          </button>
        </div>

        <div className="relative w-full aspect-square bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropDone}
          />
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-cb-text-muted flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-cb-teal h-1"
            />
            <ZoomIn className="w-4 h-4 text-cb-text-muted flex-shrink-0" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cb-text-secondary bg-cb-surface-hover rounded-lg hover:bg-cb-surface-active transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Rotate
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-cb-text-secondary hover:bg-cb-surface-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-cb-teal text-white rounded-lg hover:bg-cb-dark transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
