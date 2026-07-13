# Design System

## Overview

The Morningstar Solution design system provides a consistent, accessible, and scalable set of UI components for building enterprise SaaS interfaces.

## Design Principles

- **Clarity** — Every component communicates its purpose without ambiguity.
- **Density** — Information-dense layouts suitable for engineering professionals.
- **Accessibility** — WCAG-compliant keyboard navigation, ARIA support, and focus management.
- **Consistency** — Single source of truth for colors, spacing, typography, and interaction patterns.
- **Scalability** — Components compose naturally; no breaking changes as the platform grows.

## Theme System

### Color Tokens

All colors are exposed as CSS custom properties on `:root` (light) and `.dark` (dark) selectors.

| Token                | Light     | Dark      | Usage               |
| -------------------- | --------- | --------- | ------------------- |
| `--background`       | `#ffffff` | `#0a0a0a` | Page background     |
| `--foreground`       | `#171717` | `#ededed` | Primary text        |
| `--muted`            | `#f5f5f5` | `#141414` | Subtle background   |
| `--muted-foreground` | `#737373` | `#a3a3a3` | Secondary text      |
| `--border`           | `#e5e5e5` | `#262626` | Borders, dividers   |
| `--ring`             | `#171717` | `#ededed` | Focus rings         |
| `--accent`           | `#2563eb` | `#3b82f6` | Accent actions      |
| `--destructive`      | `#dc2626` | `#ef4444` | Destructive actions |
| `--success`          | `#16a34a` | `#22c55e` | Success states      |
| `--warning`          | `#d97706` | `#f59e0b` | Warning states      |
| `--surface`          | `#fafafa` | `#141414` | Surface backgrounds |
| `--sidebar`          | `#fafafa` | `#0f0f0f` | Sidebar background  |

### Typography

- Font: Geist Sans (system fallback: Arial, Helvetica)
- Monospace: Geist Mono
- Scale: Tailwind's default type scale

### Spacing

- 4px base unit (Tailwind spacing scale)
- Component padding: 16px (p-4), 24px (p-6)
- Section gaps: 32px (gap-8)

### Elevation

```
--shadow-xs:  0 1px 2px rgb(0 0 0 / 0.04)
--shadow-sm:  0 1px 3px rgb(0 0 0 / 0.06)
--shadow-md:  0 4px 6px rgb(0 0 0 / 0.08)
--shadow-lg:  0 10px 15px rgb(0 0 0 / 0.08)
--shadow-xl:  0 20px 25px rgb(0 0 0 / 0.10)
```

### Breakpoints

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

### Animation

```
--animate-fade-in:   opacity 0 → 1, 150ms
--animate-slide-up:  translateY(4px) → 0, 200ms
--animate-slide-down: translateY(-4px) → 0, 200ms
```

## Theme Provider

The `ThemeProvider` handles:

- System preference detection via `prefers-color-scheme` media query
- Persistent theme selection in `localStorage`
- Manual light/dark/system toggle
- `resolvedTheme` — the actual applied theme regardless of setting

```tsx
import { ThemeProvider, useTheme } from "@/providers";

function App() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return <button onClick={() => setTheme("dark")}>Switch to Dark</button>;
}
```

## Component Architecture

### Component Anatomy

All reusable components share:

1. **forwardRef** — Access to underlying DOM node
2. **cn() utility** — Tailwind class merging with clsx
3. **"use client" directive** — Browser interactivity
4. **ARIA attributes** — role, aria-label, aria-expanded, etc.
5. **Consistent props** — variant, size, className patterns

### Naming Conventions

- Component files: `kebab-case.tsx`
- Component exports: `PascalCase`
- Props interfaces: `{ComponentName}Props`
- Variant prop: `variant` (primary, secondary, ghost, destructive)
- Size prop: `size` (sm, md, lg)

### Type Safety

All components use:

- Strict TypeScript with explicit return types
- Union types for variant and size props
- `forwardRef` with proper generic typing
- `Omit<>` and `extends` for prop composition

## Accessibility Guidelines

### Keyboard Navigation

| Component           | Key            | Action        |
| ------------------- | -------------- | ------------- |
| Button / IconButton | Enter/Space    | Activate      |
| Switch              | Enter/Space    | Toggle        |
| DropdownMenu        | Enter/Space    | Open menu     |
| DropdownMenuItem    | Enter          | Select item   |
| Modal / Drawer      | Escape         | Close         |
| Tabs                | Tab/Arrow Keys | Navigate tabs |

### ARIA Attributes

- `role="alert"` — Alert, Toast
- `role="dialog"` and `aria-modal="true"` — Modal, Drawer
- `role="tablist"`, `role="tab"`, `role="tabpanel"` — Tabs
- `aria-checked` — Switch
- `aria-expanded` — DropdownMenu trigger
- `aria-label` — IconButton, Progress, LoadingSpinner
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` — Progress

### Focus Management

- `focus-visible:ring-2 focus-visible:ring-ring` on all interactive elements
- Modal/Drawer trap focus and manage body scroll
- `onEscape` handlers on overlays
- Screen reader announcements via `role="status"` and `aria-live`

## Color Accessibility

All color combinations meet WCAG 2.1 AA contrast ratios:

- Text on background: minimum 4.5:1
- Large text: minimum 3:1
- UI components: minimum 3:1

## Responsive Design

Components use Tailwind responsive prefixes:

- Mobile-first approach (base styles = mobile)
- `sm:` — Tablet
- `lg:` — Desktop

Layout components provide responsive grid columns and breakpoint-aware sizing.

## Component Usage

### Buttons

```tsx
<Button variant="primary" size="md">Action</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Form Controls

```tsx
<Input label="Email" placeholder="user@example.com" error={error} />
<Textarea label="Description" rows={4} />
<Select label="Status" options={statusOptions} placeholder="Select..." />
<Checkbox label="I agree" checked={checked} onCheckedChange={setChecked} />
<Switch label="Notifications" checked={enabled} />
```

### Data Display

```tsx
<MetricCard label="Total" value="$84K" trend="up" trendValue="+12%" />
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
<Badge variant="success">Active</Badge>
<StatusIndicator status="active" label="Online" />
```

### Overlays

```tsx
<Modal isOpen={open} onClose={() => setOpen(false)} title="Title">
  Content
</Modal>
<Drawer isOpen={open} onClose={() => setOpen(false)} title="Panel">
  Content
</Drawer>
<Alert variant="error">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

### Navigation

```tsx
<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Current" }]} />
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="a">Tab A</TabsTrigger>
    <TabsTrigger value="b">Tab B</TabsTrigger>
  </TabsList>
  <TabsContent value="a">Content A</TabsContent>
</Tabs>
```

## Icons

The system uses [Lucide React](https://lucide.dev/) for all icons. Import individual icons:

```tsx
import { Search, Settings, Bell } from "lucide-react";
```

Icons are tree-shakeable — only imported icons are included in the bundle.

## UI Showcase

Visit `/design-system` in the running application to see all components rendered with their variants.
