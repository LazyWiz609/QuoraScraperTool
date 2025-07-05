import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface QAData {
  question: string;
  answer: string;
  link: string;
}

export class PDFService {
  static async generatePDF(qaData: QAData[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(24)
         .fillColor('#3B82F6')
         .text('Quora Q&A Export', { align: 'center' });
      
      doc.moveDown();
      
      // Add generation date
      doc.fontSize(12)
         .fillColor('#666666')
         .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      
      doc.moveDown(2);

      // Add each Q&A pair
      qaData.forEach((qa, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        // Question
        doc.fontSize(16)
           .fillColor('#1F2937')
           .text(`Q${index + 1}:`, { continued: true })
           .text(` ${qa.question}`, { width: 495 });
        
        doc.moveDown(0.5);

        // Answer
        doc.fontSize(12)
           .fillColor('#374151')
           .text('Answer:', { width: 495 });
        
        doc.fontSize(11)
           .fillColor('#4B5563')
           .text(qa.answer, { width: 495, align: 'justify' });
        
        doc.moveDown(0.5);

        // Source link
        doc.fontSize(10)
           .fillColor('#3B82F6')
           .text('Source: ', { continued: true })
           .text(qa.link, { 
             width: 495,
             link: qa.link,
             underline: true
           });
        
        doc.moveDown(2);
        
        // Add separator line (except for last item)
        if (index < qaData.length - 1) {
          doc.strokeColor('#E5E7EB')
             .lineWidth(1)
             .moveTo(50, doc.y)
             .lineTo(545, doc.y)
             .stroke();
          
          doc.moveDown(1);
        }
      });

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(10)
           .fillColor('#9CA3AF')
           .text(`Page ${i + 1} of ${pageCount}`, 
                  50, 
                  doc.page.height - 50, 
                  { align: 'center' });
      }

      doc.end();
    });
  }
}
