import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-color-picker-popover',
  template: `
    <div class="color-picker-popover">
      <div class="popover-header">
        <h3>{{ colorName }}</h3>
      </div>
      
      <div class="color-picker-content">
        <!-- Main Color Palette -->
        <div class="main-palette">
          <canvas 
            #colorCanvas
            class="color-canvas"
            width="400" 
            height="280"
            (click)="onCanvasClick($event)"
            (mousemove)="onCanvasMouseMove($event)"
            (mousedown)="onCanvasMouseDown($event)"
            (mouseup)="onCanvasMouseUp()">
          </canvas>
          <div class="canvas-cursor" 
               [style.left.px]="cursorX" 
               [style.top.px]="cursorY"
               [style.display]="showCursor ? 'block' : 'none'">
          </div>
        </div>
        
        <!-- Hue Slider -->
        <div class="hue-slider-container">
          <canvas 
            #hueCanvas
            class="hue-canvas"
            width="400" 
            height="24"
            (click)="onHueClick($event)">
          </canvas>
          <div class="hue-cursor" 
               [style.left.px]="hueCursorX">
          </div>
        </div>
        
        <!-- Hex Input -->
        <div class="hex-input-section">
          <ion-input
            [(ngModel)]="hexInput"
            (ionInput)="onHexInputChange($event)"
            placeholder="#000000"
            maxlength="7"
            class="hex-input">
            <div slot="start" class="current-color-preview" [style.background-color]="selectedColor"></div>
          </ion-input>
        </div>
        
        <!-- Preset Colors -->
        <div class="preset-colors">
          <div class="preset-header">
            <h4>Preset colors</h4>
            <ion-button 
              fill="clear" 
              size="small" 
              color="primary"
              (click)="addCurrentColorToPresets()">
              <ion-icon name="add" slot="start"></ion-icon>
              Add color
            </ion-button>
          </div>
          <div class="preset-grid">
            <div 
              *ngFor="let color of presetColors; trackBy: trackByColor" 
              class="preset-swatch"
              [style.background-color]="color"
              [class.selected]="selectedColor === color"
              (click)="selectColor(color)"
              (contextmenu)="removePresetColor(color, $event)">
            </div>
            <!-- Add color button -->
            <div class="preset-swatch add-color-btn" (click)="addCurrentColorToPresets()">
              <ion-icon name="add" color="medium"></ion-icon>
            </div>
          </div>
        </div>
        
        <!-- Color Preview -->
        <div class="color-preview">
          <div class="preview-info">
            <div class="preview-square" [style.background-color]="selectedColor"></div>
            <div class="color-details">
              <div class="color-label">{{ selectedColor }}</div>
              <div class="color-rgb">{{ getRgbString() }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="popover-actions">
        <ion-button 
          fill="clear" 
          color="medium"
          (click)="cancel()">
          Cancel
        </ion-button>
        <ion-button 
          fill="solid"
          color="primary"
          (click)="save()">
          Select
        </ion-button>
      </div>
    </div>
  `,
  styles: [`
    .color-picker-popover {
      min-width: 560px;
      max-width: 600px;
      width: 100%;
      padding: 0;
      box-sizing: border-box;
      border-radius: 16px;
      overflow: hidden;
    }
    
    .popover-header {
      padding: 16px 16px 8px 16px;
      border-bottom: 1px solid var(--ion-color-light);
      text-align: center;
    }
    
    .popover-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }
    
    .color-picker-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .main-palette {
      position: relative;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .color-canvas {
      display: block;
      cursor: crosshair;
      border-radius: 8px;
    }
    
    .canvas-cursor {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 0 3px rgba(0,0,0,0.5);
    }
    
    .hue-slider-container {
      position: relative;
      margin-bottom: 16px;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .hue-canvas {
      display: block;
      cursor: pointer;
      border-radius: 4px;
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
    
    .hex-input-section {
      margin-bottom: 20px;
    }
    
    .hex-input {
      font-family: 'Courier New', monospace;
      --padding-start: 50px;
      --padding-end: 12px;
    }
    
    .current-color-preview {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      border: 2px solid var(--ion-color-light);
      margin-left: 8px;
    }
    
    .preset-colors {
      margin-bottom: 20px;
    }
    
    .preset-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .preset-header h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-medium);
    }
    
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
    }
    
    .preset-swatch {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 2px solid var(--ion-color-light);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    
    .preset-swatch:hover {
      transform: scale(1.1);
      border-color: var(--ion-color-primary);
    }
    
    .preset-swatch.selected {
      border-color: var(--ion-color-primary);
      border-width: 3px;
      transform: scale(1.05);
    }
    
    .preset-swatch.selected::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
    }
    
    .add-color-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-light);
      border: 2px dashed var(--ion-color-medium);
    }
    
    .add-color-btn:hover {
      background: var(--ion-color-light-shade);
      border-color: var(--ion-color-primary);
    }
    
    .color-preview {
      margin-bottom: 16px;
    }
    
    .preview-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .preview-square {
      width: 50px;
      height: 50px;
      border: 2px solid var(--ion-color-light);
      border-radius: 8px;
      flex-shrink: 0;
    }
    
    .color-details {
      flex: 1;
    }
    
    .color-label {
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
      margin-bottom: 4px;
    }
    
    .color-rgb {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    
    .popover-actions {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px 16px 16px;
      border-top: 1px solid var(--ion-color-light);
    }
    
    .popover-actions ion-button {
      margin: 0;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ColorPickerPopoverComponent implements OnInit, AfterViewInit {
  @Input() colorName: string = '';
  @Input() currentColor: string = '#000000';
  @ViewChild('colorCanvas') colorCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('hueCanvas') hueCanvas!: ElementRef<HTMLCanvasElement>;
  
  selectedColor: string = '';
  hexInput: string = '';
  
  // Canvas properties
  private colorCtx!: CanvasRenderingContext2D;
  private hueCtx!: CanvasRenderingContext2D;
  private isDragging = false;
  
  // Color picker state
  private hue = 0;
  private saturation = 1;
  private brightness = 1;
  
  // Cursor positions
  cursorX = 0;
  cursorY = 0;
  hueCursorX = 0;
  showCursor = false;
  
  // Preset colors with ability to add/remove
  presetColors: string[] = [
    '#ff0000', '#ff4500', '#ffa500', '#ffff00', '#9acd32', '#00ff00',
    '#00ffff', '#0000ff', '#4169e1', '#8a2be2', '#ff1493', '#ff69b4',
    '#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#92949c', '#222428',
    '#ffffff', '#f4f5f8', '#e9ecef', '#dee2e6', '#6c757d', '#495057'
  ];

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.selectedColor = this.currentColor;
    this.hexInput = this.currentColor;
    
    // Parse initial color to HSB
    this.parseColorToHSB(this.currentColor);
  }
  
  ngAfterViewInit() {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.initializeCanvases();
      this.drawColorPalette();
      this.drawHueSlider();
      this.updateCursorPositions();
    }, 0);
  }

  private initializeCanvases() {
    this.colorCtx = this.colorCanvas.nativeElement.getContext('2d')!;
    this.hueCtx = this.hueCanvas.nativeElement.getContext('2d')!;
  }
  
  private drawColorPalette() {
    const canvas = this.colorCanvas.nativeElement;
    const ctx = this.colorCtx;
    const width = canvas.width;
    const height = canvas.height;
    
    // Create base hue color
    const hueColor = this.hsbToHex(this.hue, 1, 1);
    
    // Create horizontal gradient (saturation)
    const saturationGradient = ctx.createLinearGradient(0, 0, width, 0);
    saturationGradient.addColorStop(0, '#ffffff');
    saturationGradient.addColorStop(1, hueColor);
    
    ctx.fillStyle = saturationGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Create vertical gradient (brightness)
    const brightnessGradient = ctx.createLinearGradient(0, 0, 0, height);
    brightnessGradient.addColorStop(0, 'rgba(0,0,0,0)');
    brightnessGradient.addColorStop(1, 'rgba(0,0,0,1)');
    
    ctx.fillStyle = brightnessGradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  private drawHueSlider() {
    const canvas = this.hueCanvas.nativeElement;
    const ctx = this.hueCtx;
    const width = canvas.width;
    const height = canvas.height;
    
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    
    // Create rainbow gradient
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1/6, '#ffff00');
    gradient.addColorStop(2/6, '#00ff00');
    gradient.addColorStop(3/6, '#00ffff');
    gradient.addColorStop(4/6, '#0000ff');
    gradient.addColorStop(5/6, '#ff00ff');
    gradient.addColorStop(1, '#ff0000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  onCanvasClick(event: MouseEvent) {
    this.updateColorFromCanvas(event);
  }
  
  onCanvasMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.showCursor = true;
    this.updateColorFromCanvas(event);
  }
  
  onCanvasMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.updateColorFromCanvas(event);
    }
  }
  
  onCanvasMouseUp() {
    this.isDragging = false;
  }
  
  private updateColorFromCanvas(event: MouseEvent) {
    const canvas = this.colorCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to canvas coordinates
    const canvasX = (x / rect.width) * canvas.width;
    const canvasY = (y / rect.height) * canvas.height;
    
    // Update saturation and brightness
    this.saturation = Math.max(0, Math.min(1, canvasX / canvas.width));
    this.brightness = Math.max(0, Math.min(1, 1 - (canvasY / canvas.height)));
    
    // Update cursor position
    this.cursorX = x;
    this.cursorY = y;
    
    // Update selected color
    this.updateSelectedColor();
  }
  
  onHueClick(event: MouseEvent) {
    const canvas = this.hueCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    // Update hue
    this.hue = (x / rect.width) * 360;
    this.hueCursorX = x;
    
    // Redraw color palette with new hue
    this.drawColorPalette();
    this.updateSelectedColor();
  }
  
  private updateSelectedColor() {
    this.selectedColor = this.hsbToHex(this.hue, this.saturation, this.brightness);
    this.hexInput = this.selectedColor;
  }
  
  private updateCursorPositions() {
    const colorCanvas = this.colorCanvas.nativeElement;
    const hueCanvas = this.hueCanvas.nativeElement;
    
    // Update color canvas cursor
    this.cursorX = this.saturation * colorCanvas.clientWidth;
    this.cursorY = (1 - this.brightness) * colorCanvas.clientHeight;
    this.showCursor = true;
    
    // Update hue cursor
    this.hueCursorX = (this.hue / 360) * hueCanvas.clientWidth;
  }
  
  selectColor(color: string) {
    this.selectedColor = color;
    this.hexInput = color;
    this.parseColorToHSB(color);
    this.drawColorPalette();
    this.updateCursorPositions();
  }

  onHexInputChange(event: any) {
    let newColor = event.detail.value;
    
    // Auto-add # if missing
    if (newColor && !newColor.startsWith('#')) {
      newColor = '#' + newColor;
      this.hexInput = newColor;
    }
    
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/i.test(newColor)) {
      this.selectedColor = newColor;
      this.parseColorToHSB(newColor);
      this.drawColorPalette();
      this.updateCursorPositions();
    }
  }
  
  private parseColorToHSB(hex: string) {
    const rgb = this.hexToRgb(hex);
    if (rgb) {
      const hsb = this.rgbToHsb(rgb.r, rgb.g, rgb.b);
      this.hue = hsb.h;
      this.saturation = hsb.s;
      this.brightness = hsb.b;
    }
  }
  
  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  private rgbToHsb(r: number, g: number, b: number): {h: number, s: number, b: number} {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const brightness = max;
    
    if (delta !== 0) {
      if (max === r) {
        h = ((g - b) / delta) % 6;
      } else if (max === g) {
        h = (b - r) / delta + 2;
      } else {
        h = (r - g) / delta + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    
    return { h, s, b: brightness };
  }
  
  private hsbToHex(h: number, s: number, b: number): string {
    const rgb = this.hsbToRgb(h, s, b);
    return `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
  }
  
  private hsbToRgb(h: number, s: number, b: number): {r: number, g: number, b: number} {
    const c = b * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = b - c;
    
    let r = 0, g = 0, blue = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; blue = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; blue = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; blue = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; blue = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; blue = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; blue = x;
    }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((blue + m) * 255)
    };
  }
  
  getRgbString(): string {
    const rgb = this.hexToRgb(this.selectedColor);
    return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
  }
  
  addCurrentColorToPresets() {
    if (this.selectedColor && !this.presetColors.includes(this.selectedColor)) {
      this.presetColors.push(this.selectedColor);
    }
  }
  
  removePresetColor(color: string, event: Event) {
    event.preventDefault();
    const index = this.presetColors.indexOf(color);
    if (index > -1) {
      this.presetColors.splice(index, 1);
    }
  }
  
  trackByColor(index: number, color: string): string {
    return color;
  }

  async save() {
    await this.modalController.dismiss({
      color: this.selectedColor,
      saved: true
    });
  }

  async cancel() {
    await this.modalController.dismiss({
      saved: false
    });
  }
}
