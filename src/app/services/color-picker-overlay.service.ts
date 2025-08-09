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
    return new Promise((resolve) => {
      // Create the component
      this.overlayRef = createComponent(ColorPickerOverlayComponent, {
        environmentInjector: this.injector
      });

      // Set the inputs
      this.overlayRef.instance.colorName = colorName;
      this.overlayRef.instance.currentColor = currentColor;

      // Set up the callbacks
      this.overlayRef.instance.onColorSelected = (color: string) => {
        this.close();
        resolve({ saved: true, color });
      };

      this.overlayRef.instance.onCancel = () => {
        this.close();
        resolve({ saved: false });
      };

      // Attach to the DOM
      this.appRef.attachView(this.overlayRef.hostView);
      const domElement = (this.overlayRef.hostView as any).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElement);

      // Initialize the component
      this.overlayRef.instance.ngOnInit();
      setTimeout(() => {
        this.overlayRef?.instance.ngAfterViewInit();
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
