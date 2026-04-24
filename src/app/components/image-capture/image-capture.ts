import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CapturedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

@Component({
  selector: 'app-image-capture',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './image-capture.html',
  styleUrl: './image-capture.scss',
})
export class ImageCaptureComponent {
  @Input() hint = 'Tap to take a photo!';
  @Output() imageCaptured = new EventEmitter<CapturedImage>();

  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  preview: string | null = null;

  triggerCapture(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      this.preview = dataUrl;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
      this.imageCaptured.emit({ base64, mimeType, dataUrl });
    };
    reader.readAsDataURL(file);
  }

  retake(): void {
    this.preview = null;
    this.fileInput.nativeElement.value = '';
  }
}
