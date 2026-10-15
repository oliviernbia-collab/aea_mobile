import { Text, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

export default function AccesRefuse() {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-4 bg-bgLight dark:bg-bgDark">
      <FontAwesome6 name="lock" size={40} color="#94a3b8" />
      <Text className="text-slate-600 dark:text-slate-300 text-center">
        Vous n&apos;avez pas les droits pour acceder a cette page.
      </Text>
    </View>
  );
}
