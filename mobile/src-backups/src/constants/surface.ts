import { Platform } from 'react-native';

/** Elevación discreta para superficies interactivas, teñida con el color del tema. */
export function softSurfaceShadow(color: string) {
  return Platform.select({
    web: { boxShadow: `0 7px 20px ${color}20` },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 2,
    },
  });
}
