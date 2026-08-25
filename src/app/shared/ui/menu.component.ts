import { Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { EllipsisVertical, LucideAngularModule, type LucideIconData } from 'lucide-angular';

export interface MenuItem {
  label: string;
  icon?: LucideIconData;
  danger?: boolean;
  onSelect: () => void;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="relative">
      <button
        type="button"
        class="btn btn-ghost h-8 w-8 rounded-md p-0"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label()"
        (click)="toggle($event)"
      >
        <lucide-icon [img]="ellipsisIcon" size="18"></lucide-icon>
      </button>

      @if (open()) {
        <div
          class="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
          role="menu"
        >
          @for (item of items(); track item.label) {
            <button
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors {{
                item.danger
                  ? 'text-danger hover:bg-danger-soft'
                  : 'text-ink hover:bg-surface-strong'
              }}"
              (click)="select(item, $event)"
            >
              @if (item.icon) {
                <lucide-icon [img]="item.icon" size="16"></lucide-icon>
              }
              {{ item.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class MenuComponent {
  readonly items = input.required<MenuItem[]>();
  readonly label = input<string>('More options');
  readonly ellipsisIcon = EllipsisVertical;
  readonly open = signal(false);
  private readonly el = inject(ElementRef);

  toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }

  select(item: MenuItem, event: Event): void {
    event.stopPropagation();
    this.open.set(false);
    item.onSelect();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
