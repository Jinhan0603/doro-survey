import { assetUrl } from '../../../utils/urls';

type Props = { size?: number };

/** DORO 설문 brand symbol — speech-bubble + checklist app icon. */
export function BrandLogo({ size = 40 }: Props) {
  return (
    <img
      src={assetUrl('logo.png?v=20260630b')}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
