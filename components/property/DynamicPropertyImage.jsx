import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DynamicPropertyImage({ uri, style, imageStyle, label = "Image unavailable", resizeMode = "cover", children }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View style={[{ backgroundColor: "#F1F3F8", alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="image-outline" size={22} color="#98A2B3" />
        </View>
        <Text style={{ color: "#667085", fontSize: 10, marginTop: 7 }}>{label}</Text>
        {children}
      </View>
    );
  }

  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <Image source={{ uri }} style={[{ width: "100%", height: "100%" }, imageStyle]} resizeMode={resizeMode} onError={() => setFailed(true)} />
      {children}
    </View>
  );
}
