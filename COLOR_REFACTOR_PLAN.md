# Color System Refactor Plan

## Overview
Restructuring the flashcard app's color system to provide more granular control over different UI elements.

## New Color Categories

### Primary Colors
- Primary Color
- Secondary Color  
- Tertiary Color

### Backgrounds
- Page Background
- Card Background
- Header Background
- Footer Background

### Text Colors
- Page Text
- Card Text
- Header Text
- Footer Text

### Button Colors
- Button Text
- Button Background

## Current Implementation Analysis

### ✅ What's Already Implemented
The app already has a sophisticated color system with:
- **Primary Colors**: Primary, Secondary, Tertiary ✅
- **Backgrounds**: Page Background, Card Background, Header Background ✅  
- **Text Colors**: Primary Text, Secondary Text, Header Text ✅
- **Button Colors**: Button Background, Button Text ✅

### ✅ All Color Options Now Implemented
- **Backgrounds**: Footer Background ✅, Item Background ✅
- **Text Colors**: Card Text ✅, Footer Text ✅, Item Text ✅

### 🔧 Current Architecture
- Color schemes stored in `lightColorScheme` and `darkColorScheme` objects
- Dynamic CSS variable updates via `applyColors()` method
- Advanced color picker integration via overlay service
- Proper RGB conversion and shade/tint generation

## Implementation Checklist

### Phase 1: Analysis & Setup
- [x] Audit current color usage in global.scss
- [x] Audit current color usage across all components
- [ ] Identify missing color options vs user requirements
- [ ] Plan integration of missing options

### Phase 2: Core Updates
- [x] Update global.scss with new color variables
- [x] Update settings page HTML for new color options
- [x] Update settings page TypeScript for new color handling
- [x] Update color picker integration for new options

### Phase 3: Component Updates
- [ ] Update home.page (main flashcard interface)
- [ ] Update decks.page (deck management)
- [ ] Update settings.page (settings interface)
- [ ] Update add-card modal/component
- [ ] Update any other modals and popups

### Phase 4: Testing & Validation
- [ ] Test all color changes in light mode
- [ ] Test all color changes in dark mode
- [ ] Verify color picker functionality
- [ ] Test color persistence
- [ ] Visual consistency check

## Files to Modify

### Core Files
- `src/global.scss` - Main color definitions
- `src/app/settings/settings.page.html` - Settings UI
- `src/app/settings/settings.page.ts` - Settings logic

### Component Files
- `src/app/home/home.page.html`
- `src/app/home/home.page.scss`
- `src/app/decks/decks.page.html`
- `src/app/decks/decks.page.scss`
- Other component files as discovered

### Service Files
- Settings service (if exists)
- Color picker service

## Notes
- Maintain backward compatibility during transition
- Ensure dark mode continues to work properly
- Preserve existing color picker functionality
- Test thoroughly on different devices/screen sizes

## Progress Tracking
- **Started**: 2025-08-09
- **Current Phase**: Phase 2 - Complete ✅
- **Completion**: [x] Core Implementation Complete

## Implementation Summary
Successfully added the 3 missing color options:
1. **Footer Background** - Added to Backgrounds section
2. **Card Text** - Added to Text Colors section  
3. **Footer Text** - Added to Text Colors section

All changes integrate seamlessly with the existing advanced color picker system.
