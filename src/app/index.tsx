import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-gray-900">
        Rusuh Booking Tiket
      </Text>
      <Text className="mt-2 text-gray-600">Welcome to the mobile app</Text>

      {/* GH-3 Verification Infrastructure — Remove after merge */}
      <Link href="/__signal-ui-verify" asChild>
        <Pressable className="mt-8 rounded-lg bg-blue-500 px-6 py-3">
          <Text className="font-semibold text-white">Signal UI Verify</Text>
        </Pressable>
      </Link>
    </View>
  );
}
