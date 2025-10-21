import { FileMetadata, FileDelta, FileSnapshot } from '../../types/files';

export class FileDeltaDetector {
  /**
   * Detect changes between two file snapshots
   */
  static detectDelta(
    previousSnapshot: FileSnapshot | null,
    currentSnapshot: FileSnapshot
  ): FileDelta {
    const previousFiles = previousSnapshot?.files || [];
    const currentFiles = currentSnapshot.files;

    // Create maps for efficient lookup
    const previousFileMap = new Map<string, FileMetadata>();
    const currentFileMap = new Map<string, FileMetadata>();

    previousFiles.forEach(file => {
      previousFileMap.set(file.checksum || file.filePath, file);
    });

    currentFiles.forEach(file => {
      currentFileMap.set(file.checksum || file.filePath, file);
    });

    // Detect changes
    const added: FileMetadata[] = [];
    const removed: FileMetadata[] = [];
    const modified: FileMetadata[] = [];
    const unchanged: FileMetadata[] = [];

    // Find added and modified files
    currentFiles.forEach(currentFile => {
      const key = currentFile.checksum || currentFile.filePath;
      const previousFile = previousFileMap.get(key);

      if (!previousFile) {
        // File is new
        added.push(currentFile);
      } else if (this.hasFileChanged(previousFile, currentFile)) {
        // File has been modified
        modified.push(currentFile);
      } else {
        // File is unchanged
        unchanged.push(currentFile);
      }
    });

    // Find removed files
    previousFiles.forEach(previousFile => {
      const key = previousFile.checksum || previousFile.filePath;
      if (!currentFileMap.has(key)) {
        removed.push(previousFile);
      }
    });

    return {
      id: `delta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      indexId: currentSnapshot.indexId,
      previousSnapshotId: previousSnapshot?.id,
      currentSnapshotId: currentSnapshot.id,
      added,
      removed,
      modified,
      unchanged,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      unchangedCount: unchanged.length,
      createdAt: new Date()
    };
  }

  /**
   * Check if a file has changed between snapshots
   */
  private static hasFileChanged(
    previousFile: FileMetadata,
    currentFile: FileMetadata
  ): boolean {
    // Compare checksums first (most reliable)
    if (previousFile.checksum && currentFile.checksum) {
      if (previousFile.checksum !== currentFile.checksum) {
        return true;
      }
    }

    // Compare file size
    if (previousFile.fileSize !== currentFile.fileSize) {
      return true;
    }

    // Compare modification time
    if (previousFile.modifiedAt.getTime() !== currentFile.modifiedAt.getTime()) {
      return true;
    }

    // Compare image dimensions if applicable
    if (previousFile.width && currentFile.width) {
      if (previousFile.width !== currentFile.width || previousFile.height !== currentFile.height) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate a summary report of the delta
   */
  static generateDeltaReport(delta: FileDelta): string {
    const totalChanges = delta.addedCount + delta.removedCount + delta.modifiedCount;
    const totalFiles = totalChanges + delta.unchangedCount;

    let report = `File Delta Report\n`;
    report += `================\n\n`;
    report += `Snapshot: ${delta.currentSnapshotId}\n`;
    report += `Previous: ${delta.previousSnapshotId || 'None (Initial snapshot)'}\n`;
    report += `Date: ${delta.createdAt.toLocaleString()}\n\n`;
    report += `Summary:\n`;
    report += `- Total Files: ${totalFiles}\n`;
    report += `- Added: ${delta.addedCount}\n`;
    report += `- Removed: ${delta.removedCount}\n`;
    report += `- Modified: ${delta.modifiedCount}\n`;
    report += `- Unchanged: ${delta.unchangedCount}\n\n`;

    if (delta.addedCount > 0) {
      report += `Added Files:\n`;
      delta.added.forEach(file => {
        report += `  + ${file.fileName} (${this.formatFileSize(file.fileSize)})\n`;
      });
      report += `\n`;
    }

    if (delta.removedCount > 0) {
      report += `Removed Files:\n`;
      delta.removed.forEach(file => {
        report += `  - ${file.fileName} (${this.formatFileSize(file.fileSize)})\n`;
      });
      report += `\n`;
    }

    if (delta.modifiedCount > 0) {
      report += `Modified Files:\n`;
      delta.modified.forEach(file => {
        report += `  * ${file.fileName} (${this.formatFileSize(file.fileSize)})\n`;
      });
      report += `\n`;
    }

    return report;
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Filter delta by file type
   */
  static filterDeltaByFileType(delta: FileDelta, fileTypes: string[]): FileDelta {
    const filterFiles = (files: FileMetadata[]) =>
      files.filter(file => fileTypes.includes(file.fileType));

    return {
      ...delta,
      added: filterFiles(delta.added),
      removed: filterFiles(delta.removed),
      modified: filterFiles(delta.modified),
      unchanged: filterFiles(delta.unchanged),
      addedCount: filterFiles(delta.added).length,
      removedCount: filterFiles(delta.removed).length,
      modifiedCount: filterFiles(delta.modified).length,
      unchangedCount: filterFiles(delta.unchanged).length
    };
  }

  /**
   * Get files that changed in a specific time range
   */
  static getFilesChangedInRange(
    delta: FileDelta,
    startDate: Date,
    endDate: Date
  ): FileMetadata[] {
    const allChangedFiles = [...delta.added, ...delta.modified, ...delta.removed];
    
    return allChangedFiles.filter(file => {
      const fileDate = file.modifiedAt;
      return fileDate >= startDate && fileDate <= endDate;
    });
  }
}

