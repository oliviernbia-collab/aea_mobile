import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

export default function PasswordInput({ icon = true, className = '', value, onChangeText, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative flex-row items-center">
      {icon && (
        <FontAwesome6
          name="lock"
          size={14}
          color="#94a3b8"
          style={{ position: 'absolute', left: 12, zIndex: 1 }}
        />
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        placeholderTextColor="#94a3b8"
        className={`flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-2.5 ${icon ? 'pl-9' : 'pl-3'} pr-10 text-sm ${className}`}
        {...props}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={{ position: 'absolute', right: 10 }}
        hitSlop={10}
      >
        <FontAwesome6 name={visible ? 'eye-slash' : 'eye'} size={14} color="#94a3b8" />
      </Pressable>
    </View>
  );
}
