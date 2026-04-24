import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GeminiResult } from '../../services/gemini.service';

@Component({
  selector: 'app-result-display',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './result-display.html',
  styleUrl: './result-display.scss',
})
export class ResultDisplayComponent implements OnChanges {
  @Input() collectionImageBase64!: string;
  @Input() collectionMimeType = 'image/jpeg';
  @Input() result!: GeminiResult;
  @Output() tryAgain = new EventEmitter<void>();

  @ViewChild('canvas', { static: false }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['result'] && this.result) {
      setTimeout(() => this.drawResult(), 50);
    }
  }

  private drawResult(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (this.result.found && this.result.box) {
        const [ymin, xmin, ymax, xmax] = this.result.box;
        const x = (xmin / 1000) * canvas.width;
        const y = (ymin / 1000) * canvas.height;
        const w = ((xmax - xmin) / 1000) * canvas.width;
        const h = ((ymax - ymin) / 1000) * canvas.height;

        // Outer glow
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 8;
        ctx.strokeRect(x, y, w, h);

        // Inner highlight
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Label background
        ctx.shadowBlur = 0;
        const label = '🎯 Found it!';
        ctx.font = `bold ${Math.max(20, canvas.width * 0.04)}px Nunito, Arial`;
        const tw = ctx.measureText(label).width;
        const lh = Math.max(20, canvas.width * 0.04) + 12;
        const lx = Math.min(x, canvas.width - tw - 16);
        const ly = Math.max(lh, y);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(lx, ly - lh, tw + 16, lh);
        ctx.fillStyle = '#000';
        ctx.fillText(label, lx + 8, ly - 6);
      }
    };
    img.src = `data:${this.collectionMimeType};base64,${this.collectionImageBase64}`;
  }
}
