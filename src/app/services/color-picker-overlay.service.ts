import { Injectable, ComponentRef, ViewContainerRef, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ColorPickerOverlayComponent } from '../components/color-picker-overlay.component';

@Injectable({
  providedIn: 'root'
})
export class ColorPickerOverlayService {
  private overlayRef: ComponentRef<ColorPickerOverlayComponent> | null = null;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  async open(colorName: string, currentColor: string): Promise<{ saved: boolean; color?: string }> {
    console.log('=== COLOR PICKER SERVICE OPEN ===');
    console.log('Color name:', colorName);
    console.log('Current color:', currentColor);
    
    return new Promise((resolve) => {
      // Create the component
      console.log('Creating color picker component...');
      this.overlayRef = createComponent(ColorPickerOverlayComponent, {
        environmentInjector: this.injector
      });
      console.log('Component created');

      // Set the inputs
      this.overlayRef.instance.colorName = colorName;
      this.overlayRef.instance.currentColor = currentColor;
      console.log('Inputs set');

      // Set up the callbacks
      console.log('Setting up callbacks...');
      this.overlayRef.instance.onColorSelected = (color: string) => {
        console.log('onColorSelected callback triggered with color:', color);
        this.close();
        resolve({ saved: true, color });
      };

      this.overlayRef.instance.onCancel = () => {
        console.log('onCancel callback triggered');
        this.close();
        resolve({ saved: false });
      };
      console.log('Callbacks set');

      // Attach to the DOM
      console.log('Attaching to DOM...');
      this.appRef.attachView(this.overlayRef.hostView);
      const domElement = (this.overlayRef.hostView as any).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElement);
      console.log('Attached to DOM, element:', domElement);

      // Initialize the component
      console.log('Initializing component...');
      this.overlayRef.instance.ngOnInit();
      setTimeout(() => {
        console.log('Running ngAfterViewInit...');
        this.overlayRef?.instance.ngAfterViewInit();
        console.log('=== COLOR PICKER SERVICE OPEN COMPLETE ===');
      }, 0);
    });
  }

  private close() {
    if (this.overlayRef) {
      this.appRef.detachView(this.overlayRef.hostView);
      this.overlayRef.destroy();
      this.overlayRef = null;
    }
  }
}
