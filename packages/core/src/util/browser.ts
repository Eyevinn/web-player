export function isSafari() {
  return (
    /safari/.test(window.navigator.userAgent.toLowerCase()) &&
    /apple computer/.test(window.navigator.vendor.toLowerCase())
  );
}