import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a5' | 'letter';
  margin?: number; // mm
  scale?: number;
}

/**
 * Downloads a DOM element as a crisp, high-resolution PDF file.
 * Perfect for Receipts, ID Cards, Fee Ledgers, Course Quotations, and Expense Vouchers.
 */
export async function downloadElementAsPdf(
  elementOrId: HTMLElement | string,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  const element =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    console.error('Target element for PDF export not found:', elementOrId);
    return false;
  }

  try {
    const scale = options.scale || 2;
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Ensure cloned element has solid background and no scrollbars
        const clonedEl = clonedDoc.getElementById(
          typeof elementOrId === 'string' ? elementOrId : element.id
        );
        if (clonedEl) {
          clonedEl.style.overflow = 'visible';
          clonedEl.style.boxShadow = 'none';
        }
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const orientation = options.orientation || 'portrait';
    const format = options.format || 'a4';
    const margin = options.margin !== undefined ? options.margin : 8; // 8mm margin

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= usableHeight) {
      // Fits neatly on a single page
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page document splitting
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = position - usableHeight;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= usableHeight;
      }
    }

    const safeFileName = (options.fileName || 'document.pdf').endsWith('.pdf')
      ? options.fileName || 'document.pdf'
      : `${options.fileName || 'document'}.pdf`;

    pdf.save(safeFileName);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    // Fallback to standard window.print if html2canvas/jspdf encounters browser DOM restriction
    window.focus();
    window.print();
    return false;
  }
}

/**
 * Triggers clean browser print with automatic focus
 */
export function triggerPrint() {
  window.focus();
  window.print();
}
