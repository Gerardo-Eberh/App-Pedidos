import { jsPDF } from 'jspdf';
import { Order } from '../types';

/**
 * Generates and downloads a highly polished, professional PDF report of the purchase request.
 * Designed with a corporate grid layout, typography pairing, and embedded optimized product photos.
 * Includes the company logo loaded dynamically to prevent CORS and timing issues.
 */
export function generateOrderPDF(order: Order): void {
  const logoUrl = "https://lh3.googleusercontent.com/d/1dsqngOzhSBBnQ1iODVsMJ348yOHXTe6G";
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = logoUrl;

  const proceedWithPDF = (logoImg?: HTMLImageElement) => {
    // Initialize PDF (Standard Letter size, portrait, millimeters)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let currentY = 15;

    // Helper: Draw professional header
    const drawHeaderAndFooter = (pageNumber: number, totalPages: number) => {
      // Top colored border stripe
      doc.setFillColor(5, 150, 105); // emerald green
      doc.rect(0, 0, pageWidth, 4, 'F');

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Documento generado electrónicamente • Solicitudes de Compra v1.0`, margin, pageHeight - 10);
      doc.text(`Pág. ${pageNumber}`, pageWidth - margin - 10, pageHeight - 10);
    };

    // Header Page 1
    drawHeaderAndFooter(1, 1);

    // If logo image is loaded successfully, draw it at top right
    if (logoImg) {
      try {
        const logoWidth = 32;
        const logoHeight = 12;
        doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, currentY + 3, logoWidth, logoHeight);
      } catch (err) {
        console.error("Error drawing logo in PDF:", err);
      }
    }

    // Title block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // deep slate-900
    doc.text('SOLICITUD DE COMPRA', margin, currentY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Identificador de Requerimiento: ${order.code}`, margin, currentY + 15);
    currentY += 22;

    // Metadata Panel (Corporate Box)
    doc.setFillColor(248, 250, 252); // light slate background
    doc.setDrawColor(226, 232, 240); // borders
    doc.rect(margin, currentY, pageWidth - (margin * 2), 35, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    
    doc.text('Solicitado por:', margin + 4, currentY + 6);
    doc.text('Área / Proyecto:', margin + 4, currentY + 14);
    doc.text('Fecha Creación:', margin + 4, currentY + 22);
    doc.text('Estado:', margin + 4, currentY + 30);

    doc.setFont('helvetica', 'normal');
    doc.text(order.requestedBy || 'No especificado', margin + 35, currentY + 6);
    doc.text(order.title || 'No especificado', margin + 35, currentY + 14);
    doc.text(new Date(order.createdAt).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }), margin + 35, currentY + 22);
    
    // Status with custom styling
    const statusLabel = order.status === 'submitted' ? 'EMITIDO' : 'BORRADOR';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(order.status === 'submitted' ? 5 : 100, order.status === 'submitted' ? 150 : 116, order.status === 'submitted' ? 105 : 139);
    doc.text(statusLabel, margin + 35, currentY + 30);
    
    currentY += 42;

    // Overall notes if present
    if (order.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Observaciones Generales de la Solicitud:', margin, currentY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitNotes = doc.splitTextToSize(order.notes, pageWidth - (margin * 2));
      doc.text(splitNotes, margin, currentY + 5);
      currentY += 10 + (splitNotes.length * 4);
    }

    // Items Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('DETALLE DE ARTÍCULOS REQUERIDOS', margin, currentY);
    currentY += 5;

    // Table setup
    const colWidths = {
      photo: 20,
      code: 28,
      description: 65,
      quantity: 16,
      uom: 13,
      observations: 46
    };

    const colPositions = {
      photo: margin,
      code: margin + colWidths.photo,
      description: margin + colWidths.photo + colWidths.code,
      quantity: margin + colWidths.photo + colWidths.code + colWidths.description,
      uom: margin + colWidths.photo + colWidths.code + colWidths.description + colWidths.quantity,
      observations: margin + colWidths.photo + colWidths.code + colWidths.description + colWidths.quantity + colWidths.uom,
    };

    // Header row
    doc.setFillColor(15, 23, 42); // deep slate-900 background for table header
    doc.rect(margin, currentY, pageWidth - (margin * 2), 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255); // white text

    doc.text('FOTO', colPositions.photo + 2, currentY + 5);
    doc.text('CÓDIGO', colPositions.code + 2, currentY + 5);
    doc.text('DESCRIPCIÓN', colPositions.description + 2, currentY + 5);
    doc.text('CANT', colPositions.quantity + 2, currentY + 5);
    doc.text('UNIDAD', colPositions.uom + 2, currentY + 5);
    doc.text('OBSERVACIONES', colPositions.observations + 2, currentY + 5);

    currentY += 7;
    let pageIndex = 1;

    // Draw Items Rows
    order.items.forEach((item, index) => {
      // Pre-calculate heights
      const wrappedDesc = doc.splitTextToSize(item.description, colWidths.description - 4);
      const wrappedObs = doc.splitTextToSize(item.observations || '-', colWidths.observations - 4);
      
      // Rows always have a minimum height of 18mm to fit the product thumbnail comfortably (14mm size)
      const textLinesHeight = Math.max(wrappedDesc.length, wrappedObs.length) * 4 + 4;
      const rowHeight = Math.max(18, textLinesHeight);

      // If row exceeds page, add page break
      if (currentY + rowHeight > pageHeight - 15) {
        doc.addPage();
        pageIndex++;
        currentY = 15;
        drawHeaderAndFooter(pageIndex, pageIndex);
        
        // Redraw table headers on new page
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('FOTO', colPositions.photo + 2, currentY + 5);
        doc.text('CÓDIGO', colPositions.code + 2, currentY + 5);
        doc.text('DESCRIPCIÓN', colPositions.description + 2, currentY + 5);
        doc.text('CANT', colPositions.quantity + 2, currentY + 5);
        doc.text('UNIDAD', colPositions.uom + 2, currentY + 5);
        doc.text('OBSERVACIONES', colPositions.observations + 2, currentY + 5);
        currentY += 7;
      }

      // Zebra striping
      doc.setFillColor(index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 251);
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, currentY, pageWidth - (margin * 2), rowHeight, 'FD');

      // Drawing the product photo if exists
      if (item.imageUrl) {
        try {
          // Embed the base64 compressed JPEG inside the cell
          doc.addImage(item.imageUrl, 'JPEG', colPositions.photo + 2, currentY + 2, 14, 14);
        } catch (err) {
          console.error("Error drawing image in PDF:", err);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text('[Error Foto]', colPositions.photo + 3, currentY + 10);
        }
      } else {
        // Draw a neat placeholder box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(241, 245, 249);
        doc.rect(colPositions.photo + 2, currentY + 2, 14, 14, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text('S/F', colPositions.photo + 7, currentY + 10, { align: 'center' });
      }

      // Write text details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      // Code
      doc.setFont('courier', 'bold'); // monospace for codes
      doc.text(item.productCode, colPositions.code + 2, currentY + 6);
      
      // Description
      doc.setFont('helvetica', 'normal');
      doc.text(wrappedDesc, colPositions.description + 2, currentY + 6);

      // Quantity
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.quantity), colPositions.quantity + 4, currentY + 6);

      // UOM
      doc.setFont('helvetica', 'normal');
      doc.text(item.uom, colPositions.uom + 2, currentY + 6);

      // Observations
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // slightly lighter text
      doc.text(wrappedObs, colPositions.observations + 2, currentY + 6);

      currentY += rowHeight;
    });

    // Save the PDF
    const safeTitle = order.title ? order.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'requisicion';
    doc.save(`Requisicion_${order.code}_${safeTitle}.pdf`);
  };

  img.onload = () => {
    proceedWithPDF(img);
  };

  img.onerror = () => {
    proceedWithPDF();
  };
}
