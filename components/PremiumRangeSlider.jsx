import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Platform } from 'react-native';
const TRACK_HEIGHT = 6; 

// Redfin Signature Style Palette
const ACTIVE_COLOR = '#4A43EC'; 
const INACTIVE_COLOR = '#D1D5DB'; 
const TEXT_COLOR = '#222222'; 

// Redfin Rectangular Handle Metrics
const THUMB_WIDTH = 24; 
const THUMB_HEIGHT = 24;
const THUMB_RADIUS = 20;

const PremiumRangeSlider = ({
    min = 0,
    max = 100,
    initialMin,
    initialMax,
    step = 1,
    onValuesChange,
    onValuesChangeFinish,
    formatLabel,
}) => {
    const initialMinValue = useMemo(() => initialMin ?? min, [initialMin, min]);
    const initialMaxValue = useMemo(() => initialMax ?? max, [initialMax, max]);

    const minThumbPosition = useRef(new Animated.Value(0)).current;
    const maxThumbPosition = useRef(new Animated.Value(0)).current;

    const currentMinValue = useRef(initialMinValue);
    const currentMaxValue = useRef(initialMaxValue);

    const [displayMin, setDisplayMin] = useState(initialMinValue);
    const [displayMax, setDisplayMax] = useState(initialMaxValue);
    const [activeThumb, setActiveThumb] = useState(null);
    const [sliderWidth, setSliderWidth] = useState(0);
    const activeThumbRef = useRef(null);

    // Convert value to position coordinates
    const valueToPosition = useCallback((value) => {
        const range = max - min;
        const percentage = (value - min) / range;
        return percentage * sliderWidth;
    }, [min, max, sliderWidth]);

    // Convert screen coordinates directly back to target steps values
    const positionToValue = useCallback((position) => {
        const percentage = sliderWidth ? Math.max(0, Math.min(1, position / sliderWidth)) : 0;
        const rawValue = min + percentage * (max - min);
        const steppedValue = min + Math.round((rawValue - min) / step) * step;
        return Math.max(min, Math.min(max, steppedValue));
    }, [min, max, step, sliderWidth]);

    React.useEffect(() => {
        const minPos = valueToPosition(initialMinValue);
        const maxPos = valueToPosition(initialMaxValue);
        
        minThumbPosition.setValue(minPos);
        maxThumbPosition.setValue(maxPos);
        
        currentMinValue.current = initialMinValue;
        currentMaxValue.current = initialMaxValue;
    }, [initialMinValue, initialMaxValue, valueToPosition, minThumbPosition, maxThumbPosition]);

    const updateValues = useCallback((newMin, newMax, isFinal = false) => {
        currentMinValue.current = newMin;
        currentMaxValue.current = newMax;
        setDisplayMin(newMin);
        setDisplayMax(newMax);

        if (isFinal) {
            onValuesChangeFinish?.([newMin, newMax]);
        } else {
            onValuesChange?.([newMin, newMax]);
        }
    }, [onValuesChange, onValuesChangeFinish]);

    const moveActiveThumb = useCallback((position) => {
        const clampedPosition = Math.max(0, Math.min(sliderWidth, position));

        if (activeThumbRef.current === 'min') {
            const maxPosition = valueToPosition(currentMaxValue.current);
            const nextValue = positionToValue(Math.min(clampedPosition, maxPosition));
            minThumbPosition.setValue(valueToPosition(nextValue));
            updateValues(nextValue, currentMaxValue.current, false);
        } else if (activeThumbRef.current === 'max') {
            const minPosition = valueToPosition(currentMinValue.current);
            const nextValue = positionToValue(Math.max(clampedPosition, minPosition));
            maxThumbPosition.setValue(valueToPosition(nextValue));
            updateValues(currentMinValue.current, nextValue, false);
        }
    }, [maxThumbPosition, minThumbPosition, positionToValue, sliderWidth, updateValues, valueToPosition]);

    const rangePanResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
            const touchPosition = event.nativeEvent.locationX;
            const minDistance = Math.abs(touchPosition - valueToPosition(currentMinValue.current));
            const maxDistance = Math.abs(touchPosition - valueToPosition(currentMaxValue.current));
            const thumb = minDistance <= maxDistance ? 'min' : 'max';

            activeThumbRef.current = thumb;
            setActiveThumb(thumb);
            moveActiveThumb(touchPosition);
        },
        onPanResponderMove: (event) => moveActiveThumb(event.nativeEvent.locationX),
        onPanResponderRelease: () => {
            activeThumbRef.current = null;
            setActiveThumb(null);
            updateValues(currentMinValue.current, currentMaxValue.current, true);
        },
        onPanResponderTerminate: () => {
            activeThumbRef.current = null;
            setActiveThumb(null);
            updateValues(currentMinValue.current, currentMaxValue.current, true);
        },
        onPanResponderTerminationRequest: () => false,
    }), [moveActiveThumb, updateValues, valueToPosition]);

    const activeTrackStyle = useMemo(() => ({
        left: minThumbPosition.interpolate({
            inputRange: [0, Math.max(1, sliderWidth)],
            outputRange: [0, Math.max(1, sliderWidth)],
            extrapolate: 'clamp',
        }),
        width: Animated.subtract(maxThumbPosition, minThumbPosition).interpolate({
            inputRange: [0, Math.max(1, sliderWidth)],
            outputRange: [0, Math.max(1, sliderWidth)],
            extrapolate: 'clamp',
        }),
    }), [minThumbPosition, maxThumbPosition, sliderWidth]);

    const formattedMin = formatLabel?.(displayMin) ?? `₹${displayMin}`;
    const formattedMax = formatLabel?.(displayMax) ?? `₹${displayMax}`;

    return (
        <View style={styles.container}>
            {/* Value Labels Header */}
            <View style={styles.labelsContainer}>
                <Text style={styles.labelText}>{formattedMin}</Text>
                <Text style={styles.labelSeparator}>—</Text>
                <Text style={styles.labelText}>{formattedMax}</Text>
            </View>

            {/* Slider Track Body Field */}
            <View
                style={styles.sliderContainer}
                onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
                {...rangePanResponder.panHandlers}
            >
                {/* Inactive Track */}
                <View pointerEvents="none" style={[styles.track, styles.inactiveTrack]} />

                {/* Active Track */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.track, 
                        styles.activeTrack,
                        activeTrackStyle
                    ]} 
                />

                {/* Min Thumb Rectangular Pill */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.thumb,
                        {
                            transform: [
                                { translateX: minThumbPosition },
                                { 
                                    scale: activeThumb === 'min' ? 1.05 : 1 
                                },
                            ],
                        },
                    ]}
                />

                {/* Max Thumb Rectangular Pill */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.thumb,
                        {
                            transform: [
                                { translateX: maxThumbPosition },
                                { 
                                    scale: activeThumb === 'max' ? 1.05 : 1 
                                },
                            ],
                        },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 4,
    },
    labelsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    labelText: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_COLOR,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-medium',
    },
    labelSeparator: {
        marginHorizontal: 8,
        fontSize: 14,
        color: '#666666',
    },
    sliderContainer: {
        height: 48,
        justifyContent: 'center',
        position: 'relative',
    },
    track: {
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        position: 'absolute',
    },
    inactiveTrack: {
        left: 0,
        right: 0,
        backgroundColor: INACTIVE_COLOR,
    },
    activeTrack: {
        backgroundColor: ACTIVE_COLOR,
    },
    thumb: {
        position: 'absolute',
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        borderRadius: THUMB_RADIUS,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CCCCCC',
        marginLeft: -THUMB_WIDTH / 2, 
        marginTop: -(THUMB_HEIGHT - TRACK_HEIGHT) / 2, 
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default React.memo(PremiumRangeSlider);
