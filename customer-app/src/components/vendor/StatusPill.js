import Chip from '../ui/Chip';
import { colors, statusColors, statusLabels } from '../../theme/colors';

/**
 * Order status chip.
 *
 * A thin wrapper over `Chip`'s tinted variant so the lifecycle keeps one
 * rendering across both flows: the buyer's order history and the shop's queue
 * show the same pill for the same state.
 *
 * The tint comes from the palette's `statusColors` ramp — amber while the shop
 * still owes an action, iris and azure once it is moving, mint on delivery.
 */
export default function StatusPill({ status, style }) {
  const tint = statusColors[status] ?? colors.ash;
  const label = statusLabels[status] ?? status ?? 'Unknown';

  return <Chip label={label} tint={tint} size="sm" style={style} />;
}
