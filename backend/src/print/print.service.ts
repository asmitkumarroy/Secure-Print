import {
  BadRequestException,
  GoneException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import { copyFile, mkdir, unlink } from 'fs/promises';
import { basename, extname, join } from 'path';
import { promisify } from 'util';
import { TokenRegistryService } from '../common/token-registry.service';
import { ExecutePrintDto } from './dto/execute-print.dto';

const execAsync = promisify(exec);

@Injectable()
export class PrintService {
  private readonly logger = new Logger(PrintService.name);

  constructor(private readonly tokenRegistry: TokenRegistryService) {}

  fetchByToken(token: string) {
    const record = this.tokenRegistry.find(token);

    if (!record) {
      throw new NotFoundException('Token not found');
    }

    this.assertNotExpired(record, token);

    if (record.status === 'completed') {
      throw new GoneException('Token already used');
    }

    if (record.status === 'expired') {
      throw new GoneException('Token expired');
    }

    if (record.status === 'failed') {
      throw new BadRequestException(record.failureReason ?? 'Token is not printable');
    }

    return {
      token,
      documentId: record.documentId,
      status: record.status,
      expiresAt: record.expiresAt,
      settings: record.settings,
      message: record.status === 'printing' ? 'Printing in progress.' : 'Token is valid and ready for printing.',
    };
  }

  getStatus(token: string) {
    const record = this.tokenRegistry.find(token);

    if (!record) {
      throw new NotFoundException('Token not found');
    }

    if (this.isTokenExpired(record)) {
      this.tokenRegistry.markExpired(token);
    }

    const refreshed = this.tokenRegistry.find(token);
    if (!refreshed) {
      throw new NotFoundException('Token not found');
    }

    return {
      token: refreshed.token,
      documentId: refreshed.documentId,
      status: refreshed.status,
      expiresAt: refreshed.expiresAt,
      printedAt: refreshed.printedAt,
      message:
        refreshed.status === 'completed'
          ? 'Printing completed.'
          : refreshed.status === 'printing'
            ? 'Printing in progress.'
            : refreshed.status === 'expired'
              ? 'Token expired.'
              : refreshed.failureReason ?? 'Ready for printing.',
    };
  }

  async executePrint(dto: ExecutePrintDto) {
    const record = this.tokenRegistry.find(dto.token);

    if (!record) {
      throw new NotFoundException('Token not found');
    }

    this.assertNotExpired(record, dto.token);

    if (record.status === 'completed') {
      throw new GoneException('Token already used');
    }

    if (record.status === 'expired') {
      throw new GoneException('Token expired');
    }

    if (record.status === 'failed') {
      throw new BadRequestException(record.failureReason ?? 'Token is not printable');
    }

    if (record.status === 'printing') {
      throw new BadRequestException('Token is already being printed');
    }

    this.tokenRegistry.markPrinting(dto.token);

    try {
      const printResult = await this.sendToOperatingSystem(
        record.filePath,
        dto.copies ?? record.settings.copies,
        {
          testSaveAsPdf: dto.testSaveAsPdf ?? false,
          documentId: record.documentId,
        },
      );
      this.tokenRegistry.markCompleted(dto.token);
      const cleanupResult = await this.deleteUploadedFile(record.filePath);

      const completed = this.tokenRegistry.find(dto.token);
      const baseMessage =
        printResult.mode === 'saved-pdf'
          ? `Test mode active: file saved locally via Microsoft Print to PDF path at ${printResult.savedPath}.`
          : 'Print command sent to operating system and marked completed.';

      return {
        token: dto.token,
        documentId: record.documentId,
        status: completed?.status ?? 'completed',
        printedAt: completed?.printedAt,
        savedPath: printResult.savedPath,
        fileDeleted: cleanupResult.deleted,
        message: cleanupResult.deleted
          ? `${baseMessage} Upload file deleted.`
          : `${baseMessage} Upload file was already unavailable.`,
      };
    } catch (error) {
      const message = this.toPrintableErrorMessage(error);
      const latest = this.tokenRegistry.find(dto.token);
      if (latest?.status !== 'completed') {
        this.tokenRegistry.markFailed(dto.token, message);
      }
      throw new InternalServerErrorException(message);
    }
  }

  getPdfPreview(token: string) {
    const record = this.tokenRegistry.find(token);

    if (!record) {
      throw new NotFoundException('Token not found');
    }

    this.assertNotExpired(record, token);

    if (record.status === 'completed') {
      throw new GoneException('Token already used');
    }

    if (record.status === 'expired') {
      throw new GoneException('Token expired');
    }

    if (record.status === 'failed') {
      throw new BadRequestException(record.failureReason ?? 'Token is not printable');
    }

    const isPdf = record.mimeType === 'application/pdf' || extname(record.fileName).toLowerCase() === '.pdf';
    if (!isPdf) {
      throw new BadRequestException('Preview is available only for PDF documents.');
    }

    if (!existsSync(record.filePath)) {
      throw new NotFoundException('Stored file is no longer available for preview.');
    }

    return {
      filePath: record.filePath,
      fileName: record.fileName,
    };
  }

  private isTokenExpired(record: { expiresAt: string }) {
    const expiresAtMs = Date.parse(record.expiresAt);
    return !Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now();
  }

  private assertNotExpired(record: { expiresAt: string }, token: string) {
    if (this.isTokenExpired(record)) {
      this.tokenRegistry.markExpired(token);
      throw new GoneException('Token expired');
    }
  }

  async markComplete(documentId: string | undefined, token: string | undefined) {
    const record = token
      ? this.tokenRegistry.find(token)
      : documentId
        ? this.tokenRegistry.findByDocumentId(documentId)
        : undefined;

    if (!record) {
      throw new NotFoundException('Token not found');
    }

    this.tokenRegistry.markCompleted(record.token);
    const cleanupResult = await this.deleteUploadedFile(record.filePath);

    return {
      documentId: record.documentId,
      token: record.token,
      status: 'completed',
      deleted: cleanupResult.deleted,
      message: cleanupResult.deleted
        ? 'Marked as printed, completed, and removed uploaded file.'
        : 'Marked as printed and completed. Uploaded file was already unavailable.',
    };
  }

  private async deleteUploadedFile(filePath: string): Promise<{ deleted: boolean }> {
    try {
      await unlink(filePath);
      return { deleted: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: string }).code)
          : '';

      if (code === 'ENOENT') {
        return { deleted: false };
      }

      this.logger.error(`Failed to delete uploaded file at ${filePath}: ${message}`);
      throw new Error('Print completed, but failed to remove uploaded file from storage.');
    }
  }

  private async sendToOperatingSystem(
    filePath: string,
    copies: number,
    options?: { testSaveAsPdf?: boolean; documentId?: string },
  ): Promise<{ mode: 'printed' | 'saved-pdf'; savedPath?: string }> {
    if (process.platform === 'win32') {
      const safeCopies = Math.max(1, copies);

      if (options?.testSaveAsPdf) {
        const savedPath = await this.savePdfForTesting(filePath, options.documentId, safeCopies);
        return { mode: 'saved-pdf', savedPath };
      }

      try {
        await this.printWithWindowsShell(filePath, safeCopies);
        return { mode: 'printed' };
      } catch (shellError) {
        const shellMessage = this.toPrintableErrorMessage(shellError);

        if (extname(filePath).toLowerCase() === '.pdf') {
          const printedViaFallback = await this.tryPrintPdfWithSumatra(filePath, safeCopies);
          if (printedViaFallback) {
            return { mode: 'printed' };
          }
        }

        if (this.isMissingAssociationError(shellMessage)) {
          throw new Error(
            'No print-capable PDF app is configured on this machine. Install SumatraPDF or Adobe Reader and set it as the default PDF application, then retry printing.',
          );
        }

        throw shellError;
      }
    }

    const safeCopies = Math.max(1, copies);
    const escapedPath = filePath.replace(/"/g, '\\"');
    await execAsync(`lp -n ${safeCopies} "${escapedPath}"`);
    return { mode: 'printed' };
  }

  private async savePdfForTesting(filePath: string, documentId: string | undefined, copies: number): Promise<string> {
    if (extname(filePath).toLowerCase() !== '.pdf') {
      throw new Error('Test save mode supports PDF files only.');
    }

    const outputDir = join(process.cwd(), 'printed-output');
    await mkdir(outputDir, { recursive: true });

    const baseId = documentId ?? basename(filePath, extname(filePath));
    const firstPath = join(outputDir, `${baseId}-${Date.now()}-copy1.pdf`);
    await copyFile(filePath, firstPath);

    for (let index = 2; index <= copies; index += 1) {
      const copyPath = join(outputDir, `${baseId}-${Date.now()}-copy${index}.pdf`);
      await copyFile(filePath, copyPath);
    }

    return firstPath;
  }

  private async printWithWindowsShell(filePath: string, copies: number) {
    for (let index = 0; index < copies; index += 1) {
      const escapedPath = filePath.replace(/'/g, "''");
      await execAsync(`powershell -NoProfile -Command "Start-Process -FilePath '${escapedPath}' -Verb Print"`);
    }
  }

  private async tryPrintPdfWithSumatra(filePath: string, copies: number): Promise<boolean> {
    const candidates = this.getSumatraCandidates().filter((candidate) => existsSync(candidate));
    if (candidates.length === 0) {
      return false;
    }

    const exePath = candidates[0];
    const escapedExe = exePath.replace(/"/g, '\\"');
    const escapedFile = filePath.replace(/"/g, '\\"');

    for (let index = 0; index < copies; index += 1) {
      await execAsync(`"${escapedExe}" -print-to-default -silent "${escapedFile}"`);
    }

    return true;
  }

  private getSumatraCandidates(): string[] {
    const paths = [
      process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\SumatraPDF\\SumatraPDF.exe` : '',
      process.env.ProgramFiles ? `${process.env.ProgramFiles}\\SumatraPDF\\SumatraPDF.exe` : '',
      process.env['ProgramFiles(x86)'] ? `${process.env['ProgramFiles(x86)']}\\SumatraPDF\\SumatraPDF.exe` : '',
    ];

    return paths.filter((path) => path.length > 0);
  }

  private isMissingAssociationError(message: string) {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('no application is associated') ||
      normalized.includes('this command cannot be run due to the error')
    );
  }

  private toPrintableErrorMessage(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error ?? 'Print command failed');
    const compact = raw.replace(/\s+/g, ' ').trim();

    if (this.isMissingAssociationError(compact)) {
      return 'Print failed because Windows has no default print-capable app for this file type.';
    }

    return compact.slice(0, 240);
  }
}
