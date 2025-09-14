import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ExportOptions {
  format: "png" | "jpg" | "pdf";
  quality?: number;
  backgroundColor?: string;
  filename?: string;
  title?: string;
  description?: string;
  includeTimestamp?: boolean;
}

export interface ChartExportData {
  element: HTMLElement;
  title: string;
  description?: string;
  metadata?: {
    chartType: string;
    dataPoints: number;
    columns: string[];
    generatedAt: Date;
  };
}

/**
 * Export a chart element as an image or PDF
 */
export async function exportChart(
  chartData: ChartExportData,
  options: ExportOptions = { format: "png" }
): Promise<void> {
  const {
    format = "png",
    quality = 1,
    backgroundColor = "#1f2937", // dark gray background
    filename,
    title = chartData.title,
    description,
    includeTimestamp = true,
  } = options;

  try {
    // Generate filename if not provided
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}`
      : "";
    const defaultFilename = `${title.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}${timestamp}`;
    const finalFilename = filename || defaultFilename;

    // Configure html2canvas options
    const canvasOptions = {
      backgroundColor,
      scale: quality,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: chartData.element.offsetWidth,
      height: chartData.element.offsetHeight,
    };

    // Capture the chart as canvas
    const canvas = await html2canvas(chartData.element, canvasOptions);

    if (format === "pdf") {
      await exportAsPDF(
        canvas,
        finalFilename,
        title,
        description,
        chartData.metadata
      );
    } else {
      await exportAsImage(canvas, finalFilename, format, quality);
    }
  } catch (error) {
    console.error("Failed to export chart:", error);
    throw new Error(
      `Failed to export chart: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Export canvas as image file
 */
async function exportAsImage(
  canvas: HTMLCanvasElement,
  filename: string,
  format: "png" | "jpg",
  quality: number
): Promise<void> {
  const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mimeType, quality);

  // Create download link
  const link = document.createElement("a");
  link.download = `${filename}.${format}`;
  link.href = dataUrl;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export canvas as PDF
 */
async function exportAsPDF(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string,
  description?: string,
  metadata?: ChartExportData["metadata"]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Calculate dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  // Add title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, margin, margin + 10);

  // Add description if provided
  let yPosition = margin + 20;
  if (description) {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    const descriptionLines = pdf.splitTextToSize(description, contentWidth);

    descriptionLines.forEach((line: string) => {
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 10; // Add spacing after description
  }

  // Add metadata if provided
  if (metadata) {
    if (!description) {
      yPosition = margin + 20 + 10; // If no description, start metadata lower
    }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");

    const metadataText = [
      `Chart Type: ${metadata.chartType}`,
      `Data Points: ${metadata.dataPoints.toLocaleString()}`,
      `Columns: ${metadata.columns.join(", ")}`,
      `Generated: ${metadata.generatedAt.toLocaleString()}`,
    ];

    metadataText.forEach((text) => {
      pdf.text(text, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 10; // Add spacing after metadata
  }

  // Calculate image dimensions
  const imageWidth = contentWidth;
  const imageHeight = (canvas.height / canvas.width) * imageWidth;
  const imageY = yPosition + 10;

  // Add chart image
  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", margin, imageY, imageWidth, imageHeight);

  // Save PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Get export options for different chart types
 */
export function getExportOptionsForChartType(
  chartType: string
): Partial<ExportOptions> {
  switch (chartType) {
    case "time-series":
    case "line":
      return {
        format: "png",
        quality: 1,
        backgroundColor: "#1f2937",
      };
    case "bar":
      return {
        format: "png",
        quality: 1,
        backgroundColor: "#1f2937",
      };
    case "pie":
      return {
        format: "png",
        quality: 1,
        backgroundColor: "#1f2937",
      };
    case "area":
      return {
        format: "png",
        quality: 1,
        backgroundColor: "#1f2937",
      };
    default:
      return {
        format: "png",
        quality: 1,
        backgroundColor: "#1f2937",
      };
  }
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): boolean {
  if (!["png", "jpg", "pdf"].includes(options.format)) {
    throw new Error("Invalid format. Must be 'png', 'jpg', or 'pdf'");
  }

  if (options.quality && (options.quality < 0 || options.quality > 1)) {
    throw new Error("Quality must be between 0 and 1");
  }

  return true;
}
