import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';

export type PdfTone = 'ok' | 'warn' | 'danger' | 'info';

export interface PdfPerson {
  name: string;
  details?: string[];
}

export interface PdfImage {
  caption: string;
  data: Buffer;
}

export interface PdfRow {
  label: string;
  value: string;
}

export interface PdfBarRow {
  label: string;
  value: number;
  highlight?: boolean;
  marker?: number;
}

export interface PdfSummary {
  heading: string;
  tone: PdfTone;
  text: string;
  scale?: { labels: string[]; active: number };
}

export interface PdfSignature {
  name: string;
  title?: string;
  date: Date;
}

export interface MedicalReportPdf {
  reference: string;
  title: string;
  issuedAt: Date;
  patient: PdfPerson;
  doctor: PdfPerson;
  images: PdfImage[];
  summary: PdfSummary;
  sections: { heading: string; rows?: PdfRow[]; bars?: PdfBarRow[]; text?: string }[];
  disclaimer: string;
  watermark?: string;
  badge?: { text: string; tone: PdfTone };
  signature?: PdfSignature;
}

const COLORS = {
  ink: '#17242d',
  muted: '#5f6f7c',
  faint: '#93a1ab',
  line: '#dfe5ea',
  panel: '#f4f7f9',
  zebra: '#f8fafb',
  brand: '#0b6e8a',
  brandDark: '#08566c',
  track: '#edf1f4',
  bar: '#a9cfdc',
  imageBg: '#0d171c',
  white: '#ffffff',
  ok: '#1b7f4b',
  warn: '#b7791f',
  danger: '#c0392b',
  info: '#2f6fb0',
};
const MARGIN = 48;
const BAND = 84;
const LABEL_WIDTH = 150;

@Injectable()
export class PdfService {
  private readonly appName: string;

  constructor(configService: ConfigService) {
    this.appName = configService.get<string>('app.name') ?? 'RetinaCare';
  }

  renderMedicalReport(report: MedicalReportPdf): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN + 12, bottom: MARGIN + 16, left: MARGIN, right: MARGIN },
      bufferPages: true,
      info: { Title: report.title, Author: report.doctor.name, Subject: `${this.appName} report ${report.reference}`, Creator: this.appName },
    });
    const done = collect(doc);

    this.header(doc, report);
    this.people(doc, report);
    this.images(doc, report.images);
    this.summary(doc, report.summary);
    for (const section of report.sections) this.section(doc, section);
    if (report.signature) this.signature(doc, report.signature);
    this.disclaimer(doc, report.disclaimer);
    this.decoratePages(doc, report);

    doc.end();
    return done;
  }

  private header(doc: PDFKit.PDFDocument, report: MedicalReportPdf): void {
    const pageWidth = doc.page.width;
    const right = pageWidth - MARGIN;
    doc.save().rect(0, 0, pageWidth, BAND).fill(COLORS.brand).restore();
    doc.save().rect(0, BAND, pageWidth, 3).fill(COLORS.brandDark).restore();

    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(21).text(this.appName, MARGIN, 24, { lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillOpacity(0.85).text('Diabetic retinopathy screening report', MARGIN, 50, { lineBreak: false }).fillOpacity(1);

    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.white);
    doc.text(`Ref. ${report.reference}`, MARGIN, 24, { width: right - MARGIN, align: 'right', lineBreak: false });
    doc
      .fillOpacity(0.85)
      .text(`Issued ${formatDateTime(report.issuedAt)}`, MARGIN, 37, { width: right - MARGIN, align: 'right', lineBreak: false })
      .fillOpacity(1);
    if (report.badge) this.pill(doc, report.badge.text, right, 52, COLORS[report.badge.tone], true);

    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(report.title, MARGIN, BAND + 22, { width: contentWidth(doc) });
    doc.moveDown(0.9);
  }

  private people(doc: PDFKit.PDFDocument, report: MedicalReportPdf): void {
    const gap = 14;
    const column = (contentWidth(doc) - gap) / 2;
    const inner = column - 28;
    const measure = (person: PdfPerson): number => {
      doc.font('Helvetica-Bold').fontSize(11.5);
      let height = 14 + doc.heightOfString(person.name, { width: inner }) + 4;
      doc.font('Helvetica').fontSize(9);
      for (const line of person.details ?? []) height += doc.heightOfString(line, { width: inner }) + 2;
      return height + 24;
    };
    const height = Math.max(measure(report.patient), measure(report.doctor));
    this.ensureSpace(doc, height + 16);
    const top = doc.y;

    const block = (heading: string, person: PdfPerson, x: number): void => {
      doc.save().roundedRect(x, top, column, height, 6).fill(COLORS.panel).restore();
      doc.save().roundedRect(x, top, 3, height, 1.5).fill(COLORS.brand).restore();
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(heading.toUpperCase(), x + 16, top + 12, { width: inner, characterSpacing: 0.8 });
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .text(person.name, x + 16, doc.y + 3, { width: inner });
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
      for (const line of person.details ?? []) doc.text(line, x + 16, doc.y + 2, { width: inner });
    };
    block('Patient', report.patient, MARGIN);
    block('Reviewing doctor', report.doctor, MARGIN + column + gap);

    doc.y = top + height + 18;
    doc.x = MARGIN;
  }

  private images(doc: PDFKit.PDFDocument, images: PdfImage[]): void {
    if (images.length === 0) return;
    const gap = 16;
    const size = Math.min(230, (contentWidth(doc) - gap * (images.length - 1)) / images.length);
    const rowWidth = size * images.length + gap * (images.length - 1);
    const left = MARGIN + (contentWidth(doc) - rowWidth) / 2;
    this.ensureSpace(doc, size + 30);
    const top = doc.y;

    images.forEach((image, index) => {
      const x = left + index * (size + gap);
      doc.save().roundedRect(x, top, size, size, 8).fill(COLORS.imageBg).restore();
      doc.save().roundedRect(x, top, size, size, 8).clip();
      try {
        doc.image(image.data, x, top, { fit: [size, size], align: 'center', valign: 'center' });
      } catch {
        doc
          .fillColor(COLORS.faint)
          .font('Helvetica')
          .fontSize(9)
          .text('Image unavailable', x, top + size / 2 - 5, { width: size, align: 'center' });
      }
      doc.restore();
      doc.save().roundedRect(x, top, size, size, 8).lineWidth(0.75).strokeColor(COLORS.line).stroke().restore();
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(8)
        .text(image.caption, x, top + size + 6, { width: size, align: 'center' });
    });

    doc.y = top + size + 28;
    doc.x = MARGIN;
  }

  private summary(doc: PDFKit.PDFDocument, summary: PdfSummary): void {
    const width = contentWidth(doc);
    const inner = width - 36;
    const color = COLORS[summary.tone];
    doc.font('Helvetica').fontSize(10);
    const textHeight = doc.heightOfString(summary.text, { width: inner, lineGap: 1.5 });
    const scaleHeight = summary.scale ? 34 : 0;
    const height = 14 + 11 + 18 + textHeight + scaleHeight + 14;
    this.ensureSpace(doc, height + 14);
    const top = doc.y;

    doc.save().roundedRect(MARGIN, top, width, height, 8).fillOpacity(0.07).fill(color).restore();
    doc.save().roundedRect(MARGIN, top, 4, height, 2).fill(color).restore();
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('OVERALL ASSESSMENT', MARGIN + 18, top + 14, { width: inner, characterSpacing: 0.8 });
    doc
      .fillColor(color)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(summary.heading, MARGIN + 18, top + 25, { width: inner });
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(10)
      .text(summary.text, MARGIN + 18, top + 43, { width: inner, lineGap: 1.5 });

    if (summary.scale) this.scale(doc, summary.scale, MARGIN + 18, top + 43 + textHeight + 12, inner, color);

    doc.y = top + height + 18;
    doc.x = MARGIN;
  }

  private scale(doc: PDFKit.PDFDocument, scale: NonNullable<PdfSummary['scale']>, x: number, y: number, width: number, color: string): void {
    const gap = 4;
    const count = scale.labels.length;
    const segment = (width - gap * (count - 1)) / count;
    scale.labels.forEach((label, index) => {
      const sx = x + index * (segment + gap);
      const active = index === scale.active;
      const passed = index < scale.active;
      doc
        .save()
        .roundedRect(sx, y, segment, 6, 3)
        .fillOpacity(active ? 1 : passed ? 0.35 : 1)
        .fill(active || passed ? color : COLORS.line)
        .restore();
      doc
        .fillColor(active ? COLORS.ink : COLORS.faint)
        .font(active ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(7.5)
        .text(label, sx, y + 11, { width: segment, align: 'center', lineBreak: false });
    });
  }

  private section(doc: PDFKit.PDFDocument, section: MedicalReportPdf['sections'][number]): void {
    const width = contentWidth(doc);
    this.ensureSpace(doc, 72);
    const top = doc.y;
    doc
      .save()
      .roundedRect(MARGIN, top + 1, 3, 12, 1.5)
      .fill(COLORS.brand)
      .restore();
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(11.5)
      .text(section.heading, MARGIN + 10, top, { width: width - 10 });
    doc.moveDown(0.35);
    rule(doc, COLORS.line, 0.75);
    doc.moveDown(0.5);

    section.rows?.forEach((row, index) => {
      doc.font('Helvetica').fontSize(9.5);
      const valueWidth = width - LABEL_WIDTH - 16;
      const rowHeight = Math.max(doc.heightOfString(row.label, { width: LABEL_WIDTH - 16 }), doc.heightOfString(row.value, { width: valueWidth })) + 9;
      this.ensureSpace(doc, rowHeight);
      const y = doc.y;
      if (index % 2 === 0) doc.save().roundedRect(MARGIN, y, width, rowHeight, 3).fill(COLORS.zebra).restore();
      doc.fillColor(COLORS.muted).text(row.label, MARGIN + 8, y + 4.5, { width: LABEL_WIDTH - 16 });
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .text(row.value, MARGIN + LABEL_WIDTH, y + 4.5, { width: valueWidth });
      doc.y = y + rowHeight;
    });

    if (section.bars?.length) {
      if (section.rows?.length) doc.y += 10;
      const barsHeight = section.bars.length * 19 + (section.bars.some((bar) => bar.marker !== undefined) ? 16 : 0);
      if (doc.y + barsHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(10).text(`${section.heading} (continued)`, MARGIN, doc.y, { width });
        doc.moveDown(0.6);
      }
      const track = width - LABEL_WIDTH - 108;
      for (const bar of section.bars) {
        this.ensureSpace(doc, 20);
        const y = doc.y;
        const tx = MARGIN + LABEL_WIDTH;
        const filled = clamp(bar.value) * track;
        doc
          .fillColor(bar.highlight ? COLORS.ink : COLORS.muted)
          .font(bar.highlight ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .text(bar.label, MARGIN + 8, y + 1, { width: LABEL_WIDTH - 16, lineBreak: false });
        doc
          .save()
          .roundedRect(tx, y + 2, track, 8, 4)
          .fill(COLORS.track)
          .restore();
        if (filled > 1)
          doc
            .save()
            .roundedRect(tx, y + 2, filled, 8, 4)
            .fill(bar.highlight ? COLORS.danger : COLORS.bar)
            .restore();
        if (bar.marker !== undefined) {
          const mx = tx + clamp(bar.marker) * track;
          doc
            .save()
            .moveTo(mx, y - 1)
            .lineTo(mx, y + 13)
            .lineWidth(1)
            .strokeColor(COLORS.ink)
            .strokeOpacity(0.55)
            .stroke()
            .restore();
        }
        doc
          .fillColor(COLORS.ink)
          .font(bar.highlight ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .text(`${(bar.value * 100).toFixed(1)}%`, tx + track + 6, y + 1, { width: 42, align: 'right', lineBreak: false });
        if (bar.highlight) this.pill(doc, 'DETECTED', MARGIN + width, y, COLORS.danger, false);
        doc.y = y + 19;
      }
      if (section.bars.some((bar) => bar.marker !== undefined)) {
        const y = doc.y + 2;
        doc
          .save()
          .moveTo(MARGIN + LABEL_WIDTH, y)
          .lineTo(MARGIN + LABEL_WIDTH, y + 9)
          .lineWidth(1)
          .strokeColor(COLORS.ink)
          .strokeOpacity(0.55)
          .stroke()
          .restore();
        doc
          .fillColor(COLORS.faint)
          .font('Helvetica')
          .fontSize(7.5)
          .text('Decision threshold for each finding', MARGIN + LABEL_WIDTH + 6, y + 1, { lineBreak: false });
        doc.y = y + 14;
      }
    }

    if (section.text) {
      if (section.rows?.length || section.bars?.length) doc.y += 8;
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica')
        .fontSize(10)
        .text(section.text, MARGIN + 8, doc.y, { width: width - 16, lineGap: 2.5 });
    }
    doc.x = MARGIN;
    doc.moveDown(1.3);
  }

  private signature(doc: PDFKit.PDFDocument, signature: PdfSignature): void {
    const width = 210;
    const x = MARGIN + contentWidth(doc) - width;
    this.ensureSpace(doc, 78);
    const top = doc.y + 6;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5).text('Reviewed and approved electronically by', x, top, { width });
    doc
      .save()
      .moveTo(x, top + 34)
      .lineTo(x + width, top + 34)
      .lineWidth(0.75)
      .strokeColor(COLORS.faint)
      .stroke()
      .restore();
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text(signature.name, x, top + 40, { width });
    const meta = [signature.title, formatDate(signature.date)].filter(Boolean).join('  ·  ');
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8.5)
      .text(meta, x, doc.y + 1, { width });
    doc.y += 14;
    doc.x = MARGIN;
  }

  private disclaimer(doc: PDFKit.PDFDocument, text: string): void {
    const width = contentWidth(doc);
    const inner = width - 28;
    doc.font('Helvetica').fontSize(8);
    const height = doc.heightOfString(text, { width: inner, lineGap: 1.5 }) + 34;
    this.ensureSpace(doc, height + 8);
    const top = doc.y + 4;
    doc.save().roundedRect(MARGIN, top, width, height, 6).fill(COLORS.panel).restore();
    doc
      .fillColor(COLORS.info)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('IMPORTANT', MARGIN + 14, top + 11, { width: inner, characterSpacing: 0.8 });
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text(text, MARGIN + 14, top + 23, { width: inner, lineGap: 1.5 });
    doc.y = top + height;
    doc.x = MARGIN;
  }

  private pill(doc: PDFKit.PDFDocument, text: string, right: number, y: number, color: string, onBrand: boolean): void {
    doc.font('Helvetica-Bold').fontSize(7);
    const width = doc.widthOfString(text, { characterSpacing: 0.8 }) + 14;
    const x = right - width;
    if (onBrand) doc.save().roundedRect(x, y, width, 15, 7.5).fill(COLORS.white).restore();
    else doc.save().roundedRect(x, y, width, 13, 6.5).fillOpacity(0.12).fill(color).restore();
    doc.fillColor(color).text(text, x, y + (onBrand ? 4.5 : 3.5), { width, align: 'center', characterSpacing: 0.8, lineBreak: false });
  }

  private decoratePages(doc: PDFKit.PDFDocument, report: MedicalReportPdf): void {
    const { start, count } = doc.bufferedPageRange();
    for (let index = start; index < start + count; index++) {
      doc.switchToPage(index);
      const width = contentWidth(doc);
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      if (report.watermark) {
        doc.save().rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
        doc
          .fillColor(COLORS.danger)
          .fillOpacity(0.08)
          .font('Helvetica-Bold')
          .fontSize(72)
          .text(report.watermark, 0, doc.page.height / 2 - 36, { width: doc.page.width, align: 'center', lineBreak: false });
        doc.restore();
      }

      if (index > start) {
        doc
          .fillColor(COLORS.brand)
          .fillOpacity(1)
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text(this.appName, MARGIN, 26, { width: width / 2, lineBreak: false });
        doc
          .fillColor(COLORS.muted)
          .font('Helvetica')
          .fontSize(8)
          .text(`${report.title} · Ref. ${report.reference}`, MARGIN + width / 2, 26.5, { width: width / 2, align: 'right', lineBreak: false });
        doc
          .save()
          .moveTo(MARGIN, 42)
          .lineTo(MARGIN + width, 42)
          .lineWidth(0.5)
          .strokeColor(COLORS.line)
          .stroke()
          .restore();
      }

      const bottom = doc.page.height - MARGIN + 6;
      doc
        .save()
        .moveTo(MARGIN, bottom - 8)
        .lineTo(MARGIN + width, bottom - 8)
        .lineWidth(0.5)
        .strokeColor(COLORS.line)
        .stroke()
        .restore();
      doc.fillColor(COLORS.faint).fillOpacity(1).font('Helvetica').fontSize(7.5);
      doc.text(`${this.appName} · ${report.reference}`, MARGIN, bottom, { width: width / 3, lineBreak: false });
      doc.text('Confidential medical document', MARGIN + width / 3, bottom, { width: width / 3, align: 'center', lineBreak: false });
      doc.text(`Page ${index - start + 1} of ${count}`, MARGIN + (2 * width) / 3, bottom, { width: width / 3, align: 'right', lineBreak: false });
      doc.page.margins.bottom = savedBottom;
    }
  }

  private ensureSpace(doc: PDFKit.PDFDocument, height: number): void {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      doc.x = MARGIN;
    }
  }
}

const contentWidth = (doc: PDFKit.PDFDocument): number => doc.page.width - doc.page.margins.left - doc.page.margins.right;

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const rule = (doc: PDFKit.PDFDocument, color: string, width: number): void => {
  doc
    .save()
    .moveTo(MARGIN, doc.y)
    .lineTo(doc.page.width - MARGIN, doc.y)
    .lineWidth(width)
    .strokeColor(color)
    .stroke()
    .restore();
};

const formatDate = (date: Date): string => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', dateStyle: 'medium' }).format(date);

const formatDateTime = (date: Date): string =>
  `${new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }).format(date)} UTC`;

const collect = (doc: PDFKit.PDFDocument): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
