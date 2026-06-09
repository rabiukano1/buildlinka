import React from 'react';
import { Platform, KeyboardAvoidingView, ScrollView, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = ScrollViewProps & {
  offset?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

const KeyboardAwareWrapper = React.forwardRef<React.ElementRef<typeof ScrollView>, Props>(
  ({ children, offset, containerStyle, ...scrollProps }, ref) => {
    const verticalOffset = offset ?? (Platform.OS === 'ios' ? 120 : 0);

    return (
      <KeyboardAvoidingView
        style={[{ flex: 1 }, containerStyle]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={verticalOffset}
      >
        <ScrollView
          ref={ref}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);

export default KeyboardAwareWrapper;
