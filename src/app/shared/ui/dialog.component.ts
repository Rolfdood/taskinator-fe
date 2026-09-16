import { Component, HostListener, input, output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        class="fixed inset-0 block cursor-pointer border-0 bg-slate-900/50 p-0"
        (click)="closed.emit()"
        aria-label="Close dialog"
      ></button>
      <div
        class="relative z-10 my-8 w-full max-w-lg rounded-2xl border border-line bg-surface shadow-pop"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <header class="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 class="text-lg font-semibold text-ink">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="mt-0.5 text-sm text-muted">{{ subtitle() }}</p>
            }
          </div>
          <button
            type="button"
            class="btn btn-ghost -mr-1.5 h-8 w-8 rounded-md p-0"
            (click)="closed.emit()"
            aria-label="Close"
          >
            <lucide-icon [img]="xIcon" size="18"></lucide-icon>
          </button>
        </header>
        <div class="px-5 py-4">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class DialogComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly closed = output<void>();
  readonly xIcon = X;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
