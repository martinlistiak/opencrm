import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { createPortal } from 'react-dom';
import { FileUp, X, AlertCircle } from 'lucide-react';
import { extractTextFromFile, type ExtractionProgress } from '../lib/cvExtractor';
import { parseCvText } from '../lib/cvParser';
import { setPendingCvFile } from '../lib/pendingCv';

interface CvDropZoneProps {
  children: ReactNode;
}

const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  return /\.(pdf|jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(file.name);
}

export function CvDropZone({ children }: CvDropZoneProps) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showError = useCallback((msg: string) => {
    setError(msg);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 6000);
  }, []);

  useEffect(() => {
    return () => clearTimeout(errorTimer.current);
  }, []);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer?.types.includes('Files')) return;
      if (processing) return;
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragging(true);
      }
    },
    [processing],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      if (processing) return;

      const file = e.dataTransfer?.files[0];
      if (!file) return;

      if (!isAcceptedFile(file)) {
        showError(
          'Unsupported file type. Please drop a PDF or image file (JPG, PNG, etc.).',
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showError('File is too large. Maximum size is 20 MB.');
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        const result = await extractTextFromFile(file, setProgress);
        const parsed = parseCvText(result);

        setPendingCvFile(file);
        navigate('/candidates/new', {
          state: { fromCvDrop: true, parsedData: parsed },
        });
      } catch (err) {
        showError(
          err instanceof Error ? err.message : 'Failed to process file.',
        );
      } finally {
        setProcessing(false);
        setProgress(null);
      }
    },
    [processing, navigate, showError],
  );

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <>
      {children}

      {/* --- Drag overlay --- */}
      {isDragging &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-blue-600/20 backdrop-blur-sm transition-all">
            <div className="rounded-2xl border-2 border-dashed border-blue-500 bg-white/90 px-16 py-12 text-center shadow-2xl">
              <FileUp className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <p className="text-xl font-semibold text-gray-900">
                Drop CV to create a candidate
              </p>
              <p className="mt-2 text-sm text-gray-500">
                PDF or image files accepted
              </p>
            </div>
          </div>,
          document.body,
        )}

      {/* --- Processing overlay --- */}
      {processing &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white px-8 py-8 text-center shadow-2xl mx-4">
              {/* Spinner */}
              <svg
                className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>

              <p className="text-lg font-semibold text-gray-900 mb-1">
                Processing CV
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {progress?.message ?? 'Initializing...'}
              </p>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress?.progress ?? 0}%` }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- Error toast --- */}
      {error &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-9999 flex items-start gap-3 rounded-xl border border-red-200 bg-white px-5 py-4 shadow-lg max-w-sm animate-[slideUp_0.3s_ease-out]">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                CV processing failed
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
