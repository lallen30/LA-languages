# LA Languages App - Color Variables Reference

This document provides a comprehensive reference for all color variables used in the LA Languages App. These variables correspond to the color customization options available in the Settings page.

## 🎨 Primary Colors

| Setting Name | CSS Variable | Description |
|--------------|--------------|-------------|
| **Primary Color** | `--ion-color-primary` | Main brand color used for primary UI elements |
| **Secondary** | `--ion-color-secondary` | Secondary accent color for highlights |
| **Tertiary** | `--ion-color-tertiary` | Third accent color for additional variety |

## 🏠 Background Colors

| Setting Name | CSS Variable | Description |
|--------------|--------------|-------------|
| **Background** | `--ion-background-color` | Main page background color |
| **Card Background** | `--ion-card-background` | Background color for cards and items |
| **Item Background** | `--app-item-background` | Background for individual list items |
| **Header Background** | `--ion-toolbar-background` | Top header/toolbar background |
| **Footer Background** | `--ion-tab-bar-background` | Bottom tab bar background |

## 📝 Text Colors

| Setting Name | CSS Variable | Description |
|--------------|--------------|-------------|
| **Primary Text** | `--ion-text-color` | Main text color throughout the app |
| **Secondary Text** | `--ion-color-medium` | Secondary text color for less prominent text |
| **Header Text** | `--ion-toolbar-color` | Text color in headers/toolbars |
| **Footer Text** | `--ion-tab-bar-color` | Text color in the tab bar |
| **Card Text** | `--app-card-text-color` | Text color within cards |
| **Item Text** | `--app-item-text-color` | Text color for list items |

## 🔘 Button Colors

| Setting Name | CSS Variable | Description |
|--------------|--------------|-------------|
| **Button Background** | `--ion-color-button` | Background color for buttons |
| **Button Text** | `--ion-color-button-contrast` | Text color for button labels and icons |

## 🔄 Auto-Generated Color Variants

Each primary color (Primary, Secondary, Tertiary) automatically generates these additional variables:

### Primary Color Variants
- `--ion-color-primary-rgb` - RGB values for transparency effects
- `--ion-color-primary-contrast` - High contrast color (usually white)
- `--ion-color-primary-shade` - Darker version for pressed/active states
- `--ion-color-primary-tint` - Lighter version for hover/focus states

### Secondary Color Variants
- `--ion-color-secondary-rgb`
- `--ion-color-secondary-contrast`
- `--ion-color-secondary-shade`
- `--ion-color-secondary-tint`

### Tertiary Color Variants
- `--ion-color-tertiary-rgb`
- `--ion-color-tertiary-contrast`
- `--ion-color-tertiary-shade`
- `--ion-color-tertiary-tint`

### Button Color Variants
- `--ion-color-button-rgb`
- `--ion-color-button-contrast-rgb`
- `--ion-color-button-shade`
- `--ion-color-button-tint`

### Secondary Text Color Variants
- `--ion-color-medium-rgb`
- `--ion-color-medium-contrast`
- `--ion-color-medium-shade`
- `--ion-color-medium-tint`

## 📋 Additional Custom Variables

These variables are used for specific UI components:

| Variable | Description |
|----------|-------------|
| `--app-footer-background` | Alternative footer background variable |
| `--app-footer-text-color` | Alternative footer text color variable |
| `--ion-background-color-rgb` | RGB values for main background |
| `--ion-text-color-rgb` | RGB values for main text color |

## 💻 Usage Examples

### Basic Usage
```css
.my-element {
  background-color: var(--ion-color-primary);
  color: var(--ion-text-color);
  border: 1px solid var(--ion-color-secondary);
}
```

### Using RGB Values for Transparency
```css
.semi-transparent {
  background-color: rgba(var(--ion-color-primary-rgb), 0.5);
}
```

### Interactive States
```css
.button-custom {
  background-color: var(--ion-color-button);
  color: var(--ion-color-button-contrast);
}

.button-custom:hover {
  background-color: var(--ion-color-button-tint);
}

.button-custom:active {
  background-color: var(--ion-color-button-shade);
}
```

## 🔧 How Colors Are Applied

1. **App Startup**: Colors are automatically loaded from saved settings when the app initializes
2. **Settings Page**: Users can customize colors using the advanced color picker
3. **Apply Changes**: Clicking "Apply Color Changes" updates all variables in real-time
4. **Persistence**: Color choices are saved and restored on app restart

## 🌙 Light/Dark Mode Support

The app supports both light and dark color schemes:
- **Light Mode**: Uses `lightColorScheme` settings
- **Dark Mode**: Uses `darkColorScheme` settings
- **Automatic Switching**: Colors update when toggling dark mode in settings

## 📱 Responsive Design

All color variables work seamlessly across:
- **Mobile devices** (iOS/Android)
- **Tablets**
- **Desktop browsers**
- **Different screen sizes and orientations**

---

*This reference was generated for LA Languages App v1.0.0*
*Last updated: January 2025*
