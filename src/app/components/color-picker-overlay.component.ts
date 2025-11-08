import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '../pipes/translate.pipe';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-color-picker-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe],
  template: `
    <div class="overlay-backdrop">
      <div class="color-picker-container">
        <div class="color-picker-header">
          <h3>{{ colorName }}</h3>
          <ion-button fill="clear" size="small" (click)="cancel()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
        
        <div class="color-picker-content">
          <!-- Main color canvas -->
          <div class="color-canvas-container">
            <canvas 
              #colorCanvas 
              class="color-canvas"
              width="400" 
              height="280"
              (mousedown)="onCanvasMouseDown($event)"
              (mousemove)="onCanvasMouseMove($event)"
              (mouseup)="onCanvasMouseUp()"
              (mouseleave)="onCanvasMouseUp()">
            </canvas>
            <div 
              class="canvas-cursor" 
              [style.left.px]="getCursorDisplayX()" 
              [style.top.px]="getCursorDisplayY()">
            </div>
          </div>

          <!-- Hue slider -->
          <div class="hue-slider-container">
            <canvas 
              #hueCanvas 
              class="hue-canvas"
              width="400" 
              height="24"
              (mousedown)="onHueMouseDown($event)"
              (mousemove)="onHueMouseMove($event)"
              (mouseup)="onHueMouseUp()"
              (mouseleave)="onHueMouseUp()">
            </canvas>
            <div 
              class="hue-cursor" 
              [style.left.px]="getHueCursorDisplayX()">
            </div>
          </div>

          <!-- Color preview and hex input -->
          <div class="color-info">
            <div class="color-preview" [style.background-color]="selectedColor"></div>
            <div class="color-details">
              <input 
                type="text" 
                [(ngModel)]="hexInput" 
                (input)="onHexInputChange()"
                (blur)="validateHexInput()"
                class="hex-input"
                placeholder="#000000"
                maxlength="7">
              <div class="rgb-display">
                RGB: {{ getRgbString() }}
              </div>
            </div>
          </div>

          <!-- Preset colors -->
          <div class="preset-colors-section">
            <div class="preset-header">
              <span>{{ 'settings.presetColors' | translate }}</span>
              <ion-button 
                fill="clear" 
                size="small" 
                (click)="addCurrentColorToPresets()"
                class="add-color-btn">
                <ion-icon name="add" slot="start"></ion-icon>
                {{ 'settings.addColor' | translate }}
              </ion-button>
            </div>
            <div class="preset-colors-grid">
              <div 
                *ngFor="let color of presetColors; let i = index"
                class="preset-color"
                [style.background-color]="color"
                (click)="selectPresetColor(color)"
                (contextmenu)="removePresetColor(i, $event)">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action buttons - OUTSIDE scrollable content -->
        <div class="button-row">
          <div class="action-button cancel-btn" (click)="cancel()">
            {{ 'common.cancel' | translate | uppercase }}
          </div>
          <div class="action-button select-btn" (click)="save()">
            {{ 'settings.select' | translate }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
      pointer-events: none;
    }
    
    .color-picker-container {
      background: var(--ion-color-step-50, #ffffff);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      width: 600px;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      position: relative;
      pointer-events: auto;
    }
    
    .color-picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 16px 8px 16px;
      border-bottom: 1px solid var(--ion-color-light);
      background: var(--ion-color-step-50, #ffffff);
      flex-shrink: 0;
    }
    
    .color-picker-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }
    
    .color-picker-content {
      padding: 16px;
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--ion-color-step-50, #ffffff);
      min-height: 0;
      max-height: calc(90vh - 200px);
      -webkit-overflow-scrolling: touch;
    }
    
    .color-canvas-container {
      position: relative;
      margin-bottom: 16px;
    }
    
    .color-canvas {
      width: 100%;
      height: 280px;
      border-radius: 8px;
      cursor: crosshair;
      border: 1px solid var(--ion-color-light);
    }
    
    .canvas-cursor {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
    }
    
    .hue-slider-container {
      position: relative;
      margin-bottom: 16px;
    }
    
    .hue-canvas {
      width: 100%;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid var(--ion-color-light);
    }
    
    .hue-cursor {
      position: absolute;
      top: 0;
      width: 4px;
      height: 24px;
      background: white;
      border: 1px solid #000;
      transform: translateX(-50%);
      pointer-events: none;
    }
    
    .color-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .color-preview {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      border: 1px solid var(--ion-color-light);
      flex-shrink: 0;
    }
    
    .color-details {
      flex: 1;
    }
    
    .hex-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--ion-color-light);
      border-radius: 6px;
      font-family: monospace;
      font-size: 14px;
      margin-bottom: 4px;
      background: var(--ion-color-step-50, #ffffff);
      color: var(--ion-color-dark);
    }
    
    .rgb-display {
      font-size: 12px;
      color: var(--ion-color-medium);
      font-family: monospace;
    }
    
    .preset-colors-section {
      margin-bottom: 16px;
    }
    
    .preset-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .preset-header span {
      font-weight: 500;
      color: var(--ion-color-dark);
    }
    
    .add-color-btn {
      --color: var(--ion-color-primary);
      font-size: 12px;
      font-weight: 600;
    }
    
    .preset-colors-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 8px;
    }
    
    .preset-color {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }
    
    .preset-color:hover {
      border-color: var(--ion-color-primary);
    }
    
    .button-row {
      display: flex;
      gap: 12px;
      padding: 16px;
      padding-bottom: calc(16px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--ion-color-light);
      flex-shrink: 0;
      background: var(--ion-color-step-50, #ffffff);
      z-index: 10001;
      position: relative;
    }
    
    .action-button {
      flex: 1;
      height: 50px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s;
      border: 2px solid transparent;
      position: relative;
      z-index: 1001;
    }
    
    .cancel-btn {
      background: #f4f5f8;
      color: var(--ion-color-medium);
    }
    
    .select-btn {
      background: var(--ion-color-primary);
      color: white;
    }
    
    .action-button:active {
      border-color: var(--ion-color-primary);
    }
  `]
})
export class ColorPickerOverlayComponent implements OnInit, AfterViewInit {
  @Input() colorName: string = 'Color';
  @Input() currentColor: string = '#3880ff';
  
  @ViewChild('colorCanvas', { static: false }) colorCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hueCanvas', { static: false }) hueCanvas!: ElementRef<HTMLCanvasElement>;

  selectedColor: string = '#3880ff';
  hexInput: string = '#3880ff';
  
  // Canvas state
  currentHue: number = 240;
  currentSaturation: number = 1;
  currentBrightness: number = 1;
  
  // Cursor positions
  cursorX: number = 400;
  cursorY: number = 0;
  hueCursorX: number = 266.67;
  
  // Mouse state
  isDraggingCanvas: boolean = false;
  isDraggingHue: boolean = false;
  
  // Preset colors
  presetColors: string[] = [
    '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80',
    '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080',
    '#ffffff', '#f4f5f8', '#e9ecef', '#dee2e6', '#6c757d', '#495057'
  ];

  // Output callback
  onColorSelected?: (color: string) => void;
  onCancel?: () => void;

  ngOnInit() {
    this.selectedColor = this.currentColor;
    this.hexInput = this.currentColor;
    this.parseColorToHSB(this.currentColor);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCanvases();
      this.updateCanvasFromHSB();
      this.updateCursorPositions();
    }, 0);
  }

  initializeCanvases() {
    this.drawColorCanvas();
    this.drawHueCanvas();
  }

  drawColorCanvas() {
    const canvas = this.colorCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create the HSB color space
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const saturation = x / width;
        const brightness = 1 - (y / height);
        const color = this.hsbToRgb(this.currentHue, saturation, brightness);
        
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  drawHueCanvas() {
    const canvas = this.hueCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create hue gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i <= 360; i += 60) {
      const color = this.hsbToRgb(i, 1, 1);
      gradient.addColorStop(i / 360, `rgb(${color.r}, ${color.g}, ${color.b})`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  onCanvasMouseDown(event: MouseEvent) {
    this.isDraggingCanvas = true;
    this.updateColorFromCanvas(event);
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.isDraggingCanvas) {
      this.updateColorFromCanvas(event);
    }
  }

  onCanvasMouseUp() {
    this.isDraggingCanvas = false;
  }

  onHueMouseDown(event: MouseEvent) {
    this.isDraggingHue = true;
    this.updateHueFromSlider(event);
  }

  onHueMouseMove(event: MouseEvent) {
    if (this.isDraggingHue) {
      this.updateHueFromSlider(event);
    }
  }

  onHueMouseUp() {
    this.isDraggingHue = false;
  }

  updateColorFromCanvas(event: MouseEvent) {
    const canvas = this.colorCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Debug logging
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('Canvas rect:', rect.width, 'x', rect.height);
    console.log('Mouse event:', event.clientX, event.clientY);
    console.log('Canvas rect position:', rect.left, rect.top);
    
    // Calculate the scaling factor between displayed size and internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    console.log('Scale factors:', scaleX, scaleY);
    
    // Get mouse position relative to canvas (in display coordinates)
    const mouseXDisplay = event.clientX - rect.left;
    const mouseYDisplay = event.clientY - rect.top;
    
    console.log('Mouse display coordinates:', mouseXDisplay, mouseYDisplay);
    
    // Convert to internal canvas coordinates
    const mouseX = mouseXDisplay * scaleX;
    const mouseY = mouseYDisplay * scaleY;
    
    console.log('Mouse internal coordinates:', mouseX, mouseY);
    
    // Clamp to canvas bounds
    const x = Math.max(0, Math.min(canvas.width, mouseX));
    const y = Math.max(0, Math.min(canvas.height, mouseY));

    console.log('Final cursor position:', x, y);

    this.cursorX = x;
    this.cursorY = y;

    this.currentSaturation = x / canvas.width;
    this.currentBrightness = 1 - (y / canvas.height);

    this.updateSelectedColor();
  }

  updateHueFromSlider(event: MouseEvent) {
    const canvas = this.hueCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scaling factor between displayed size and internal canvas size
    const scaleX = canvas.width / rect.width;
    
    // Get mouse position relative to canvas and scale to internal coordinates
    const mouseX = (event.clientX - rect.left) * scaleX;
    
    // Clamp to canvas bounds
    const x = Math.max(0, Math.min(canvas.width, mouseX));

    this.hueCursorX = x;
    this.currentHue = (x / canvas.width) * 360;

    this.drawColorCanvas();
    this.updateSelectedColor();
  }

  updateSelectedColor() {
    const rgb = this.hsbToRgb(this.currentHue, this.currentSaturation, this.currentBrightness);
    this.selectedColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
    this.hexInput = this.selectedColor;
  }

  updateCanvasFromHSB() {
    const canvas = this.colorCanvas.nativeElement;
    this.cursorX = this.currentSaturation * canvas.width;
    this.cursorY = (1 - this.currentBrightness) * canvas.height;
    
    const hueCanvas = this.hueCanvas.nativeElement;
    this.hueCursorX = (this.currentHue / 360) * hueCanvas.width;
  }

  getCursorDisplayX(): number {
    if (!this.colorCanvas?.nativeElement) return 0;
    const canvas = this.colorCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    // Convert internal canvas X coordinate to display coordinate
    return (this.cursorX / canvas.width) * rect.width;
  }

  getCursorDisplayY(): number {
    if (!this.colorCanvas?.nativeElement) return 0;
    const canvas = this.colorCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    // Convert internal canvas Y coordinate to display coordinate
    return (this.cursorY / canvas.height) * rect.height;
  }

  getHueCursorDisplayX(): number {
    if (!this.hueCanvas?.nativeElement) return 0;
    const canvas = this.hueCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    // Convert internal hue canvas X coordinate to display coordinate
    return (this.hueCursorX / canvas.width) * rect.width;
  }

  updateCursorPositions() {
    this.updateCanvasFromHSB();
  }

  parseColorToHSB(color: string) {
    const rgb = this.hexToRgb(color);
    if (rgb) {
      const hsb = this.rgbToHsb(rgb.r, rgb.g, rgb.b);
      this.currentHue = hsb.h;
      this.currentSaturation = hsb.s;
      this.currentBrightness = hsb.b;
    }
  }

  onHexInputChange() {
    if (this.hexInput.length >= 4) {
      this.validateHexInput();
    }
  }

  validateHexInput() {
    let hex = this.hexInput.trim();
    
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      this.selectedColor = hex;
      this.parseColorToHSB(hex);
      this.drawColorCanvas();
      this.updateCursorPositions();
    } else if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
      const expandedHex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      this.selectedColor = expandedHex;
      this.hexInput = expandedHex;
      this.parseColorToHSB(expandedHex);
      this.drawColorCanvas();
      this.updateCursorPositions();
    } else {
      this.hexInput = this.selectedColor;
    }
  }

  selectPresetColor(color: string) {
    this.selectedColor = color;
    this.hexInput = color;
    this.parseColorToHSB(color);
    this.drawColorCanvas();
    this.updateCursorPositions();
  }

  addCurrentColorToPresets() {
    if (!this.presetColors.includes(this.selectedColor)) {
      this.presetColors.push(this.selectedColor);
    }
  }

  removePresetColor(index: number, event: Event) {
    event.preventDefault();
    this.presetColors.splice(index, 1);
  }

  getRgbString(): string {
    const rgb = this.hexToRgb(this.selectedColor);
    return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '0, 0, 0';
  }

  save() {
    console.log('SAVE clicked, color:', this.selectedColor);
    if (this.onColorSelected) {
      this.onColorSelected(this.selectedColor);
    }
  }

  cancel() {
    console.log('CANCEL clicked');
    if (this.onCancel) {
      this.onCancel();
    }
  }

  // Color conversion utilities
  hsbToRgb(h: number, s: number, b: number): { r: number, g: number, b: number } {
    h = h / 360;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = b * (1 - s);
    const q = b * (1 - f * s);
    const t = b * (1 - (1 - f) * s);

    let r: number, g: number, bl: number;

    switch (i % 6) {
      case 0: r = b; g = t; bl = p; break;
      case 1: r = q; g = b; bl = p; break;
      case 2: r = p; g = b; bl = t; break;
      case 3: r = p; g = q; bl = b; break;
      case 4: r = t; g = p; bl = b; break;
      case 5: r = b; g = p; bl = q; break;
      default: r = g = bl = 0;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(bl * 255)
    };
  }

  rgbToHsb(r: number, g: number, b: number): { h: number, s: number, b: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const brightness = max;

    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / diff + 2) / 6; break;
        case b: h = ((r - g) / diff + 4) / 6; break;
      }
    }

    return { h: h * 360, s, b: brightness };
  }

  rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
