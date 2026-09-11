import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

// Renders the user's avatar_url when present and loadable; falls back to the
// first letter of their name if the URL is missing, or the image itself
// fails to load (broken link, 404, etc) — mirrors the web admin panel's
// Avatar component so both apps behave the same way.
export default function Avatar({ uri, name, className, textClassName }) {
    const [failed, setFailed] = useState(false);
    const initial = (name || "?").trim().charAt(0).toUpperCase();

    // A failed old/expired URL must not permanently suppress a newly uploaded
    // or freshly signed URL passed in by the parent.
    useEffect(() => {
        setFailed(false);
    }, [uri]);

    if (uri && !failed) {
        return (
            <Image
                source={{ uri }}
                onError={() => setFailed(true)}
                className={className}
                resizeMode="cover"
            />
        );
    }

    return (
        <View className={`items-center justify-center ${className || ""}`}>
            <Text className={textClassName}>{initial}</Text>
        </View>
    );
}
