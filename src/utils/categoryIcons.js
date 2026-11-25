// La base guarda nombres de íconos tipo "briefcase" o "utensils".
// La app dibuja MaterialCommunityIcons: este mapa traduce uno a otro.
const MAP = {
  briefcase: 'briefcase-outline',
  laptop: 'laptop',
  store: 'store-outline',
  home: 'home-outline',
  award: 'medal-outline',
  'heart-handshake': 'handshake-outline',
  'plus-circle': 'plus-circle-outline',
  utensils: 'silverware-fork-knife',
  bus: 'bus',
  'graduation-cap': 'school-outline',
  'heart-pulse': 'heart-pulse',
  zap: 'flash-outline',
  film: 'movie-open-outline',
  shirt: 'tshirt-crew-outline',
  'shopping-cart': 'cart-outline',
  'credit-card': 'credit-card-outline',
  'more-horizontal': 'dots-horizontal-circle-outline',
  tag: 'tag-outline',
};

export const iconFor = (name) => MAP[name] || 'tag-outline';
