import { Image, Text, View } from 'react-native';

export default function Logo({ size = 40, showText = true }) {
  return (
    <View className="flex-row items-center gap-2">
      <Image
        source={require('../assets/images/AEA.jpg')}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      {showText && (
        <View>
          <Text className="font-bold text-white leading-tight">AEA</Text>
          <Text className="text-[11px] text-blue-100 leading-tight">Espace Membre</Text>
        </View>
      )}
    </View>
  );
}
