import { ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageCaptureComponent, CapturedImage } from '../image-capture/image-capture';
import { ResultDisplayComponent } from '../result-display/result-display';
import { GeminiResult, GeminiService } from '../../services/gemini.service';

type Step = 'capture-target' | 'capture-collection' | 'loading' | 'result';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ImageCaptureComponent,
    ResultDisplayComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  step: Step = 'capture-target';
  targetImage: CapturedImage | null = null;
  collectionImage: CapturedImage | null = null;
  result: GeminiResult | null = null;
  errorMessage: string | null = null;
  keyTestResult: string | null = null;
  keyTestRunning = false;

  constructor(private gemini: GeminiService, private cdr: ChangeDetectorRef) {}

  async testApiKey(): Promise<void> {
    this.keyTestResult = null;
    this.keyTestRunning = true;
    const res = await this.gemini.testKey();
    this.keyTestRunning = false;
    if (res.ok) {
      this.keyTestResult = `✅ API key works!`;
    } else {
      this.keyTestResult = `❌ ${res.error}`;
    }
    this.cdr.detectChanges();
  }

  onTargetCaptured(img: CapturedImage): void {
    this.targetImage = img;
  }

  onCollectionCaptured(img: CapturedImage): void {
    this.collectionImage = img;
  }

  goToStep2(): void {
    this.step = 'capture-collection';
  }

  async findPiece(): Promise<void> {
    if (!this.targetImage || !this.collectionImage) return;
    this.step = 'loading';
    this.errorMessage = null;

    this.result = await this.gemini.findPiece(
      this.targetImage.base64,
      this.collectionImage.base64,
      this.targetImage.mimeType,
      this.collectionImage.mimeType
    );

    if (this.result.message && !this.result.found) {
      this.errorMessage = this.result.message;
    }

    this.step = 'result';
    this.cdr.detectChanges();
  }

  startOver(): void {
    this.step = 'capture-target';
    this.targetImage = null;
    this.collectionImage = null;
    this.result = null;
    this.errorMessage = null;
  }
}
