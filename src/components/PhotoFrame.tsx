import { Image, type ImageContentFit } from 'expo-image';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { isRenderablePhotoUri } from '../lib/photoUri';
import { colors } from '../theme/tokens';
import { PlaceholderPhoto } from './PlaceholderPhoto';

type PhotoFrameProps = {
  uri?: string;
  label?: string;
  dark?: boolean;
  compact?: boolean;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  backgroundColor?: string;
};

export function PhotoFrame({
  uri,
  label = '写真',
  dark = false,
  compact = false,
  style,
  contentFit = 'cover',
  backgroundColor,
}: PhotoFrameProps) {
  const photoBackgroundColor = backgroundColor ?? colors.photoLight;

  if (!isRenderablePhotoUri(uri)) {
    if (style) {
      return (
        <View style={[{ backgroundColor: photoBackgroundColor }, style as StyleProp<ViewStyle>]}>
          <PlaceholderPhoto label={label} dark={dark} compact={compact} />
        </View>
      );
    }

    return <PlaceholderPhoto label={label} dark={dark} compact={compact} />;
  }

  return (
    <Image
      source={{ uri }}
      style={[style ? styles.imageFill : styles.image, compact && styles.compact, { backgroundColor: photoBackgroundColor }, style]}
      contentFit={contentFit}
    />
  );
}

const styles = StyleSheet.create({
  compact: {
    borderRadius: 12,
    height: 88,
    width: 88,
  },
  imageFill: {
    backgroundColor: 'transparent',
    height: '100%',
    width: '100%',
  },
  image: {
    aspectRatio: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
});
