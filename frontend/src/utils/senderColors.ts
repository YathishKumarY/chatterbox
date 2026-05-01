const SENDER_COLORS = [
  '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#009688', '#FF5722', '#795548', '#607D8B',
  '#F44336', '#2196F3', '#4CAF50', '#FF9800',
  '#00BCD4', '#8BC34A', '#CDDC39',
];

export function getSenderColor(senderId: string): string {
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = ((hash << 5) - hash + senderId.charCodeAt(i)) | 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}
