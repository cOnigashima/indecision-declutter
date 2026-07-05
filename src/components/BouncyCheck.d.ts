import type { ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type BouncyCheckProps = {
  size: number;
  style?: StyleProp<ViewStyle>;
};

export function BouncyCheck(props: BouncyCheckProps): ReactElement;
