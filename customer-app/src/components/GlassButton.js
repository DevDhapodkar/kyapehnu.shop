import Button from './ui/Button';

/**
 * GlassButton
 *
 * The original call-to-action primitive, now a thin adapter over the design
 * system's <Button>. It stays because a dozen screens call it by name and its
 * prop contract — label / onPress / variant / disabled / loading / caption — is
 * still the right one; only the rendering moved.
 *
 * `variant` keeps its original two values and gains the system's others, so an
 * existing call site is untouched while a new one can ask for `secondary` or
 * `danger` without a second component.
 */
export default function GlassButton({ variant = 'primary', ...props }) {
  return <Button variant={variant} {...props} />;
}
