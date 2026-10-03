import { useWindowDimensions } from 'react-native';

import { breakpoints } from '@/constants/theme';

export type BreakpointSize = 'compact' | 'medium' | 'expanded';

/** Decide layout-ul după lățimea ferestrei, nu după platformă (tabletă ≈ browser îngust ≈ telefon mare). */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const size: BreakpointSize =
    width >= breakpoints.expanded ? 'expanded' : width >= breakpoints.medium ? 'medium' : 'compact';

  return {
    size,
    width,
    isCompact: size === 'compact',
    isExpanded: size === 'expanded',
    columns: size === 'expanded' ? 3 : size === 'medium' ? 2 : 1,
  };
}
