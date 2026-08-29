/**
 * The design system's public surface.
 *
 * Screens import from here (`../components/ui`) rather than reaching into
 * individual files, so the set of approved primitives is legible in one place
 * and a component can be re-implemented without touching its call sites.
 */

export { default as AnimatedNumber } from './AnimatedNumber';
export { default as BrandMark, BrandWatermark } from './BrandMark';
export { default as Button } from './Button';
export { default as Chip } from './Chip';
export { default as Divider } from './Divider';
export { default as EmptyState } from './EmptyState';
export { default as Gradient } from './Gradient';
export { default as Icon, ICON_SIZES } from './Icon';
export { default as IconButton } from './IconButton';
export { default as LiveDot } from './LiveDot';
export { default as PressableScale } from './PressableScale';
export { default as ProgressBar } from './ProgressBar';
export { default as SectionHeader } from './SectionHeader';
export { default as Skeleton, SkeletonLines } from './Skeleton';
export { default as StatTile, StatRow } from './StatTile';
export { default as Surface } from './Surface';
export { default as TextField } from './TextField';
