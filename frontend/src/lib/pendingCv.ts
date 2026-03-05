/**
 * Module-level storage for a CV file dropped via the global drop zone.
 * The CvDropZone stores the file here, and CandidateFormPage consumes it
 * to set on the file input via the DataTransfer API.
 */

let _pendingFile: File | null = null;

export function setPendingCvFile(file: File) {
  _pendingFile = file;
}

export function consumePendingCvFile(): File | null {
  const file = _pendingFile;
  _pendingFile = null;
  return file;
}
