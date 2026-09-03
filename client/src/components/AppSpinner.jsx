import _Lottie from 'lottie-react';
import spinnerData from '../assets/spinner.json';

const Lottie = _Lottie.default ?? _Lottie;

export default function AppSpinner({ size = 400 }) {
  return <Lottie animationData={spinnerData} loop style={{ width: size, height: size }} />;
}
