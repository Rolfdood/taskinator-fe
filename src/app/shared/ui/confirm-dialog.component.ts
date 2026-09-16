import { Component, input, output } from '@angular/core';
import { DialogComponent } from './dialog.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [DialogComponent],
  template: `
    <app-dialog [title]="title()" (closed)="cancelled.emit()">
      <p class="text-sm leading-relaxed text-muted">{{ message() }}</p>
      <div class="mt-5 flex items-center justify-end gap-2">
        <button type="button" class="btn btn-secondary" (click)="cancelled.emit()" [disabled]="busy()">
          Cancel
        </button>
        <button type="button" class="btn btn-danger" (click)="confirm.emit()" [disabled]="busy()">
          {{ confirmLabel() }}
        </button>
      </div>
    </app-dialog>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Delete');
  readonly busy = input<boolean>(false);
  readonly confirm = output<void>();
  readonly cancelled = output<void>();
}
