import { Stack } from 'expo-router';
import { COLORS } from '../../../constants/theme';

export default function CampaignsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
