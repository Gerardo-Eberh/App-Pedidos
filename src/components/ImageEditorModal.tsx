import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RotateCw, Sun, Check, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { compressAndResizeImage } from '../utils/imageCompressor';

interface ImageEditorModalProps {
  productCode: string;
  productDescription: string;
  currentImage?: string;
  onSave: (base64Image: string) => void;
  onClose: () => void;
}

export default function ImageEditorModal({
  productCode,
  productDescription,
  currentImage,
  onSave,
  onClose,
}: ImageEditorModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(currentImage || null);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [quality, setQuality] = useState<number>(0.65);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [estimatedSizeKb, setEstimatedSizeKb] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Estimate base64 file size
  useEffect(() => {
    if (previewSrc && previewSrc.startsWith('data:image')) {
      const stringLength = previewSrc.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.562489624; // approximation for base64
      setEstimatedSizeKb(Math.round((sizeInBytes / 1024) * 10) / 10);
    } else {
      setEstimatedSizeKb(null);
    }
  }, [previewSrc]);

  // Handle stream cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      stopCamera();
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewSrc(event.target?.result as string);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setSelectedFile(null);
    setPreviewSrc(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 400, facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setCameraActive(false);
      setCameraError('No se pudo acceder a la cámara. Asegúrese de otorgar los permisos necesarios.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const size = Math.min(video.videoWidth, video.videoHeight);
      
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Crop square from center of video stream
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewSrc(dataUrl);
        stopCamera();
      }
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        stopCamera();
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewSrc(event.target?.result as string);
          setRotation(0);
          setBrightness(100);
          setContrast(100);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleApplyEffectsAndSave = async () => {
    if (!previewSrc) return;
    setIsProcessing(true);
    
    try {
      // Create off-screen image to apply rotation & adjustments before final compression
      const img = new Image();
      img.src = previewSrc;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const finalCanvas = document.createElement('canvas');
      // Normalize to a compact 300x300 square for reports
      const finalSize = 300;
      finalCanvas.width = finalSize;
      finalCanvas.height = finalSize;
      
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not get 2D canvas context");

      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalSize, finalSize);

      // Save context, translate to center to rotate, draw image, and restore
      ctx.translate(finalSize / 2, finalSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Apply CSS adjustments manually in Canvas context
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      
      // Draw centered
      ctx.drawImage(img, -finalSize / 2, -finalSize / 2, finalSize, finalSize);
      
      // Restore filters & transformations
      ctx.filter = 'none';
      
      // Export as optimized low-weight JPEG
      const finalBase64 = finalCanvas.toDataURL('image/jpeg', quality);
      
      onSave(finalBase64);
      onClose();
    } catch (err) {
      console.error(err);
      setAlertMessage('Error al procesar y guardar la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]" id="image-editor-modal">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Editor de Imagen</span>
            <h3 className="font-semibold text-base leading-tight">Art. {productCode}</h3>
          </div>
          <button 
            onClick={() => { stopCamera(); onClose(); }} 
            className="text-slate-400 hover:text-white transition-colors p-1"
            id="close-editor-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Scrollable if small screen */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-slate-500 font-medium">
            Asigne una imagen representativa para: <span className="text-slate-950 font-semibold">{productDescription}</span>
          </p>

          {/* Photo Source Selector */}
          {!previewSrc && !cameraActive && (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 transition-all ${
                dragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50'
              }`}
            >
              <div className="bg-white p-3 rounded-full shadow-xs text-slate-400 border border-slate-100">
                <ImageIcon size={32} className="text-slate-400" />
              </div>
              
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Arrastre y suelte una foto aquí</p>
                <p className="text-xs text-slate-400 mt-1">Soporta PNG o JPG</p>
              </div>

              <div className="flex gap-2 mt-2 w-full max-w-xs justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
                  id="browse-file-btn"
                >
                  <Upload size={14} /> Seleccionar Archivo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-colors"
                  id="camera-btn"
                >
                  <Camera size={14} /> Usar Cámara
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Camera Stream View */}
          {cameraActive && (
            <div className="relative rounded-lg overflow-hidden bg-slate-950 aspect-square flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover transform -scale-x-100"
              />
              
              {/* Overlay targeting square crop */}
              <div className="absolute inset-0 border-4 border-emerald-500/30 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-dashed border-emerald-500 rounded-lg" />
              </div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md flex items-center gap-2 shadow-md"
                  id="capture-photo-btn"
                >
                  <Camera size={16} /> Capturar Foto
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-md flex items-center gap-2 shadow-md"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md flex items-start gap-2 border border-red-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {alertMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md flex items-start gap-2 border border-red-200" id="editor-alert-message">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{alertMessage}</span>
            </div>
          )}

          {/* Preview and Edit Options */}
          {previewSrc && !cameraActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Preview Box */}
              <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg p-4 relative aspect-square max-w-[240px] mx-auto border border-slate-200">
                <div className="w-full h-full rounded overflow-hidden bg-white shadow-xs flex items-center justify-center relative">
                  <img
                    src={previewSrc}
                    alt="Previsualización"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      transition: 'transform 0.15s ease'
                    }}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                {estimatedSizeKb !== null && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-mono rounded">
                    Est: {estimatedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Editing Controls */}
              <div className="space-y-4 flex flex-col justify-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ajustes de Optimización</h4>
                
                {/* Rotate */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <RotateCw size={14} /> Rotar Ángulo
                  </span>
                  <button
                    type="button"
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-1 text-xs font-bold bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                  >
                    +90°
                  </button>
                </div>

                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1"><Sun size={14} /> Brillo</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Contraste</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* File Compression Quality */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Calidad de Guardado</span>
                    <span>{Math.round(quality * 100)}% (Liviana)</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-emerald-600 font-medium leading-none">
                    * Ideal para optimizar datos de carga y almacenamiento móvil.
                  </p>
                </div>

                {/* Reset button */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewSrc(null);
                      setSelectedFile(null);
                      setRotation(0);
                      setBrightness(100);
                      setContrast(100);
                    }}
                    className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 transition-colors text-center"
                  >
                    Elegir otra foto
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => { stopCamera(); onClose(); }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-md transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!previewSrc || isProcessing}
            onClick={handleApplyEffectsAndSave}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              !previewSrc || isProcessing
                ? 'bg-emerald-400 cursor-not-allowed opacity-70'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
            }`}
            id="save-image-btn"
          >
            {isProcessing ? 'Procesando...' : <><Check size={16} /> Confirmar y Guardar</>}
          </button>
        </div>

        {/* Hidden auxiliary canvas */}
        <canvas ref={canvasRef} className="hidden" />

      </div>
    </div>
  );
}
