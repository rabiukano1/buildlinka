import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = ScrollViewProps & {
  offset?: number;
  containerStyle?: StyleProp<ViewStyle>;
  /** Rendered below the scroll area, so it rides on top of the keyboard. */
  footer?: React.ReactNode;
};

// 'padding' on both platforms: with Android edge-to-edge the window no longer resizes for the keyboard.
// The offset must be the view's real distance from the screen top (header + status bar), so it is measured.
const KeyboardAwareWrapper = React.forwardRef<React.ElementRef<typeof ScrollView>, Props>(
  ({ children, offset, containerStyle, footer, ...scrollProps }, ref) => {
    const anchor = useRef<View>(null);
    const [top, setTop] = useState(0);

    return (
      <View
        ref={anchor}
        style={[{ flex: 1 }, containerStyle]}
        onLayout={() => anchor.current?.measureInWindow((_x, y) => setTop(y))}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={offset ?? top}>
          <ScrollView
            ref={ref}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            {children}
          </ScrollView>
          {footer}
        </KeyboardAvoidingView>
      </View>
    );
  }
);

export default KeyboardAwareWrapper;
