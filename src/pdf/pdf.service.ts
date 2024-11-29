import { Injectable } from '@nestjs/common';
import { AirtableService } from 'src/airtable/airtable.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly airtableService: AirtableService,
  ) {}
  createPDF(data: any[], filePath: string): void {
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(12);
    data.forEach((record) => {
      doc.text(JSON.stringify(record, null, 2));
      doc.moveDown();
    });

    doc.end();
  }

  async uploadFileToAirtable(
    recordId: string,
    filePath: string,
  ): Promise<void> {
    fs.readFileSync(filePath);
    // await this.airtableService.saveBuyerOferta(recordId, {
    //   Attachments: [
    //     {
    //       url: `data:application/pdf;base64,${fileContent.toString('base64')}`,
    //     },
    //   ],
    // });
  }
}
