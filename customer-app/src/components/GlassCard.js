import Surface from './ui/Surface';

/**
 * GlassCard
 *
 * The original frosted pane, now an adapter over the design system's
 * <Surface>. Its two boolean props map onto the newer component's named
 * variants, so every existing call site keeps working while picking up the
 * gradient fill and specular edge that make the pane read as glass rather than
 * as a flat translucent rectangle.
 *
 *  - strong  → the denser `chrome` skin, for panes over bright imagery
 *  - compact → tighter padding, for list rows rather than hero panels
 */
export default function GlassCard({ children, strong = false, compact = false, style }) {
  return (
    <Surface
      tone={strong ? 'chrome' : 'glass'}
      padding={compact ? 'compact' : 'default'}
      style={style}
    >
      {children}
    </Surface>
  );
}
