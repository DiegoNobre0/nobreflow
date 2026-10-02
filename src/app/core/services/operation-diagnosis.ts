import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OperationDiagnosisService {
  readonly isOpen = signal(false);
  readonly source = signal('Landing page');

  open(source: string): void {
    this.source.set(source);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
