# Milestono AI Chatbot — Advanced Design System

## Design Philosophy

This redesign transforms the chatbot UI into a professional, minimalist interface inspired by ChatGPT and Gemini, featuring three core design concepts:

### 1. **Glassmorphism**
Frosted glass effects with backdrop blur create visual depth while maintaining clarity.

```css
/* Glassmorphic Surface Formula */
background: rgba(255, 255, 255, 0.7); /* Light mode */
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
border-radius: 12px;
```

**Where Applied:**
- Welcome suggestion cards (main call-to-action)
- Composer input box (top-of-mind interaction point)
- Sidebar buttons (new chat, controls)
- Message action buttons (hover state)
- All interactive surfaces

**Benefits:**
- Premium, professional appearance
- Subtle context preservation (content visible through glass)
- Elegant depth without visual clutter

### 2. **Spatial UI**
Layered depth using shadows, elevation, and visual hierarchy to guide user attention.

**Shadow Progression (Depth Hierarchy):**
- `sm`: Light shadows for resting state elements
- `md`: Medium shadows for hovered/interactive elements
- `lg`: Large shadows for elevated/modal elements
- `xl`: Extra-large shadows for emphasis

**Elevation on Interaction:**
- Hover state: `transform: translateY(-2px)` + shadow increase
- This communicates interactivity without being intrusive

**Application:**
- Welcome cards: Lift 2px on hover with shadow increase
- Message actions: Appear on hover with fade-in
- Buttons: Subtle elevation feedback on all interactions

**Benefits:**
- Clear visual hierarchy guides user interaction
- Micro-interactions provide satisfying feedback
- Professional depth perception

### 3. **Minimalism**
Content-first design with maximum negative space and essential-only UI elements.

**Core Principles:**
- **Generous spacing** (24-32px gaps between major sections)
- **Typography-driven hierarchy** (size/weight, not decoration)
- **Monochromatic base** with 1-2 accent colors (indigo/blue)
- **Hide on interaction** (controls appear on hover, not resting state)
- **Reduce visual noise** (no unnecessary borders, decorations, or distractions)

**Spacing Scale (4px base):**
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px
```

**Color Palette:**
- **Neutrals**: Gray 50-900 (light mode) / Dark surfaces (dark mode)
- **Primary**: Indigo-500/600 (brand color, ~#4f46e5)
- **Accents**: Minimal (error red for alerts, etc.)
- **Background**: Pure white (light) / #0f172a (dark)

**Benefits:**
- Clean, uncluttered interface
- Content stands out
- Professional, premium appearance
- Accessibility-friendly (high contrast, clear focus states)

---

## Component Breakdown

### **Welcome Section**
The first-impression landing for new conversations.

**Design Elements:**
- Logo centered with 56px size (large, prominent)
- Heading (32-36px, bold) with welcoming message
- Subtitle (14px, secondary gray) explaining capabilities
- **Glassmorphic suggestion cards** in a responsive grid:
  - Light mode: `rgba(255, 255, 255, 0.7)` background
  - Dark mode: `rgba(26, 32, 44, 0.6)` background
  - Border: Semi-transparent white (0.2 opacity)
  - Hover: Elevation 2px + shadow increase + brightness +5%
- Language support badge (12px text, outlined style)

**Animations:**
- Logo: Scale 0.8 → 1.0 on load (0.5s)
- Heading/subtitle: Fade + 12px slide up (0.5s)
- Cards: Staggered fade + 8px slide up (0.3s each, 0.05s delay)

**Responsive:**
- Mobile: 1 column
- Tablet+: 2 columns
- Desktop: 2 columns (max width 640px)

### **Sidebar (Desktop)**
Dark minimalist navigation panel with glassmorphism accents.

**Design Elements:**
- **Background**: Linear gradient `(180deg, #1a202c → #0f172a)` (dark theme)
- **Logo section**: 24px logo + "Milestono" text, centered
- **New Chat Button**: Full-width glassmorphic container
  - `rgba(26, 32, 44, 0.6)` background with `blur(10px)`
  - 2px left border indicator on active threads
  - Hover: Elevation 2px, background lightens
- **Thread List**: Minimal styling
  - Hover: Subtle background `rgba(255, 255, 255, 0.05)`
  - Active: Left border (2px, indigo) + background highlight
  - Delete button: Hidden by default, appears on hover (red on hover)
- **User Card**: Avatar (36px circular) + name/email
  - Glassmorphic background with border
- **Login/Logout**: Accent color buttons, high contrast
- **Footer**: Small text (10px), secondary gray

**Spacing:**
- Top padding: 20px
- Side padding: 16px
- Button margins: 16px (top/bottom)
- Gap between sections: 16px

### **Message Display**
Professional conversation rendering with spatial depth.

**Design Elements:**
- **Avatar**: 36px rounded square, subtle shadow
  - User: Indigo gradient background
  - Assistant: Logo in circular avatar
- **Message Container**: Max-width 800px, centered
  - Padding: 20px horizontal
  - Background: Subtle alternating (every other message has 0.45 opacity bg)
- **Message Actions**: Icon buttons (appear on hover)
  - Copy, read aloud, etc.
  - Hidden by default for minimalism
  - Fade in 0.15s on hover
  - Background on hover: `rgba(0, 0, 0, 0.02)`
- **Typing Skeleton**: 3 animated lines with shimmer
  - Indent left-to-right gradient (2s loop)
  - Line widths: 100%, 90%, 85% (natural variation)

**Animations:**
- Message entry: Fade + 4px upward slide (0.3s)
- Actions: Fade in (0.15s)
- Typing: Shimmer pulse (2s)

### **Composer (Input Box)**
Glassmorphic input with professional interaction feedback.

**Design Elements:**
- **Container**: Full width at bottom with glassmorphic background
  - `rgba(255, 255, 255, 0.7)` + `blur(10px)`
  - Backdrop blur creates separation from messages above
- **Textarea**: Clean, no visible border
  - Focus: Border color → indigo + ring shadow
  - Max height: 120px (auto-expand, then scroll)
  - Placeholder: Secondary gray
- **Buttons** (left-side):
  - Microphone: Color change when listening (red with pulse animation)
  - Language selector: Small badge (12px)
  - These are icon-only, minimal
- **Buttons** (right-side):
  - Send: Indigo background, white icon, always visible when text present
  - Stop: Red background (when streaming)
  - Voice mode: Toggles between speaker icons
- **Disclaimer**: Small text (11px) below, center-aligned, secondary gray

**Interactions:**
- Focus state: Ring shadow (0 0 0 3px rgba(99, 102, 241, 0.1))
- Hover: Buttons get background on hover only (no background at rest)
- Microphone listening: Red background + pulse animation
- Send button: Scales with `transform` on hover (2px elevation)

**Spacing:**
- Container padding: 16px
- Button gap: 8px
- Form padding: 12px internal
- Disclaimer margin-top: 12px

---

## CSS Architecture

### **Design Tokens (CSS Variables)**

```css
:root {
  /* Colors */
  --cb-brand-400: #6366f1;
  --cb-brand-500: #4f46e5;
  --cb-brand-600: #4338ca;
  --cb-brand-700: #3730a3;

  /* Spacing (4px base) */
  --cb-space-1: 4px;
  --cb-space-2: 8px;
  --cb-space-3: 12px;
  --cb-space-4: 16px;
  --cb-space-5: 20px;
  --cb-space-6: 24px;
  --cb-space-8: 32px;
  --cb-space-10: 40px;

  /* Border Radius */
  --cb-radius-sm: 6px;
  --cb-radius-md: 8px;
  --cb-radius-lg: 12px;
  --cb-radius-xl: 16px;

  /* Shadows (Spatial Depth) */
  --cb-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --cb-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --cb-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
  --cb-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.2);

  /* Transitions */
  --cb-transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --cb-transition-base: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --cb-transition-slow: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Glassmorphism */
  --cb-glass-light: rgba(255, 255, 255, 0.7);
  --cb-glass-light-border: rgba(255, 255, 255, 0.2);
  --cb-glass-dark: rgba(26, 32, 44, 0.6);
  --cb-glass-dark-border: rgba(255, 255, 255, 0.1);
}
```

### **Dark Mode**
Automatically detected via `@media (prefers-color-scheme: dark)`.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --cb-bg: #0f172a;
    --cb-surface: #1a202c;
    --cb-text: #f1f5f9;
    --cb-text-secondary: #cbd5e1;
    /* ... other dark values */
  }
}
```

Users' system preference is respected. Toggle can be added in future.

### **Layout Strategy**

1. **Mobile-first**: Single column, full-width
2. **Tablet (640px+)**: 2-column grids for suggestions
3. **Desktop (768px+)**: Sidebar appears, main layout shifts
4. **Large screens (1024px+)**: Max-width constraints applied to content

### **Key CSS Classes**

| Class | Purpose |
|-------|---------|
| `.cb-page` | Root container, flex layout |
| `.cb-sidebar-desktop` | Desktop sidebar (hidden mobile) |
| `.cb-main` | Main chat area |
| `.cb-scroll` | Scrollable message container |
| `.cb-welcome` | Welcome landing section |
| `.cb-messages` | Message list container |
| `.cb-msg-row` | Individual message (user or assistant) |
| `.cb-suggestion` | Welcome suggestion card |
| `.cb-composer-wrap` | Composer container (glassmorphic) |
| `.cb-composer-form` | Input form area |
| `.cb-typing` | Typing skeleton loader |

---

## Animation Specifications

### **Entrance Animations**
- **Duration**: 0.3s - 0.5s
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (standard easing)
- **Types**:
  - Fade in: `opacity: 0 → 1`
  - Slide up: `transform: translateY(4px → 0)`
  - Scale in: `transform: scale(0.8 → 1)`

### **Hover Interactions**
- **Duration**: 0.15s - 0.2s
- **Elevation**: `transform: translateY(-2px)`
- **Shadow**: Increase from `sm` to `md` or `md` to `lg`
- **Background**: Subtle brightness/opacity change

### **Skeleton Loader (Typing)**
- **Duration**: 2s (loop)
- **Animation**: Left-to-right gradient shimmer
- **Lines**: 3 lines with varying widths (100%, 90%, 85%)

### **Microphone Listening**
- **Pulse animation**: 1.5s loop, expanding box-shadow

---

## Responsive Design

### **Breakpoints**
- **Mobile**: 320px - 639px (single column)
- **Tablet**: 640px - 767px (2-column grids)
- **Desktop**: 768px+ (sidebar visible)
- **Large**: 1024px+ (max-widths applied)

### **Key Changes**
1. **Sidebar**: Hidden on mobile (drawer overlay), visible desktop (768px+)
2. **Welcome suggestions**: 1 column (mobile) → 2 columns (640px+)
3. **Card grids**: 1 column → 2 columns (640px+)
4. **Typography**: Adjusted sizes at different breakpoints

---

## Accessibility

- **Color contrast**: All text meets WCAG AA standards
- **Focus states**: Clear outline/ring visible on all interactive elements
- **Icons + labels**: Always paired with descriptive aria-labels
- **Semantic HTML**: Proper use of buttons, links, nav
- **Keyboard navigation**: Full support for tab navigation
- **Screen readers**: All interactive elements properly labeled

---

## Future Enhancements

1. **Theme Toggle**: Add user-selectable light/dark mode
2. **Custom Colors**: Allow brand color customization
3. **Advanced Animations**: Spring easing for premium feel
4. **Accessibility**: High contrast mode option
5. **Performance**: Lazy-load images, optimize animations

---

## Design Metrics

| Metric | Value |
|--------|-------|
| Max message width | 800px |
| Sidebar width (desktop) | 280px |
| Primary border radius | 12px |
| Primary shadow | `0 8px 32px rgba(0,0,0,0.1)` |
| Spacing scale base | 4px |
| Font family | Inter, system-ui, -apple-system, sans-serif |
| Primary color | #4f46e5 (indigo-500) |
| Backdrop blur | 10px |

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Backdrop filter support required (CSS backdrop-filter)
- CSS Grid and Flexbox support required
- CSS Custom Properties (variables) required
- CSS animations/transitions required

**Note**: Graceful degradation for older browsers (solid colors instead of glass effect).

---

## References

This design system is inspired by:
- ChatGPT's minimalist interface
- Gemini's spatial depth and animations
- Apple's glassmorphism design
- Material Design 3's spacing and typography
